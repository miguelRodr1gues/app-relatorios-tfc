from django.db import DatabaseError, connection

from .report_services import (
    _build_report_query_definition,
    _compose_table_key,
    _normalize_report_columns,
    _normalize_table_key,
    _normalize_related_tables,
    _split_table_key,
    _humanize_identifier,
)


def _quote_table_ref(table_key: str) -> str:
    schema_name, table_name = _split_table_key(table_key)
    if schema_name == "public":
        return f'"{table_name}"'
    return f'"{schema_name}"."{table_name}"'


def _get_allowed_columns(table_key: str):
    schema_name, table_name = _split_table_key(table_key)
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = %s AND table_name = %s
            ORDER BY ordinal_position
            """,
            [schema_name, table_name],
        )
        return [row[0] for row in cursor.fetchall()]


def _build_allowed_columns_map(base_table_key: str, selected_related_table_keys):
    selected_table_keys = [base_table_key, *selected_related_table_keys]
    return {
        selected_table_key: _get_allowed_columns(selected_table_key)
        for selected_table_key in selected_table_keys
    }


def _format_filter_column_label(table_key: str, column_name: str) -> str:
    table_name = _split_table_key(table_key)[1]
    return f"{_humanize_identifier(table_name)} - {_humanize_identifier(column_name)}"


def _validate_filter_values(selected_filters, allowed_columns_by_table):
    for selected_filter in selected_filters:
        if not isinstance(selected_filter, dict):
            continue

        table_key = selected_filter.get("table")
        column_name = selected_filter.get("column")
        filter_value = selected_filter.get("value")
        filter_operator = (selected_filter.get("operator") or "=").upper()

        if not table_key or not column_name or filter_value in [None, ""]:
            continue

        if table_key not in allowed_columns_by_table or column_name not in allowed_columns_by_table[table_key]:
            continue

        column_label = _format_filter_column_label(table_key, column_name)
        table_ref = _quote_table_ref(table_key)
        query_params = []

        if filter_operator == "LIKE":
            filter_sql = f'"{column_name}" LIKE %s'
            query_params.append(f"%{filter_value}%")
        elif filter_operator == "IN" and isinstance(filter_value, list) and filter_value:
            in_placeholders_sql = ",".join(["%s"] * len(filter_value))
            filter_sql = f'"{column_name}" IN ({in_placeholders_sql})'
            query_params.extend(filter_value)
        elif filter_operator in {"=", "!=", ">", "<", ">=", "<="}:
            filter_sql = f'"{column_name}" {filter_operator} %s'
            query_params.append(filter_value)
        else:
            return f"O operador do filtro em '{column_label}' não é suportado."

        try:
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT 1 FROM {table_ref} WHERE {filter_sql} LIMIT 1", query_params)
                exists = cursor.fetchone() is not None
        except (DatabaseError, ValueError, TypeError):
            return f"O valor '{filter_value}' não é válido para o tipo de dado da coluna '{column_label}'."

        if not exists:
            return f"Não existem dados para o filtro '{column_label}' com o valor '{filter_value}'."

    return None


def _build_filter_sql_parts(selected_filters, allowed_columns_by_table, sql_alias_by_table=None):
    where_sql_parts = []
    query_params = []
    sql_alias_by_table = sql_alias_by_table or {}

    for selected_filter in selected_filters:
        if not isinstance(selected_filter, dict):
            continue

        table_key = selected_filter.get("table")
        column_name = selected_filter.get("column")
        filter_operator = (selected_filter.get("operator") or "=").upper()
        filter_value = selected_filter.get("value")

        if not table_key or not column_name or filter_value in [None, ""]:
            continue

        if table_key not in allowed_columns_by_table or column_name not in allowed_columns_by_table[table_key]:
            continue

        column_prefix = f'{sql_alias_by_table[table_key]}.' if table_key in sql_alias_by_table else ""

        if filter_operator == "=":
            where_sql_parts.append(f'{column_prefix}"{column_name}" = %s')
            query_params.append(filter_value)
        elif filter_operator == "!=":
            where_sql_parts.append(f'{column_prefix}"{column_name}" != %s')
            query_params.append(filter_value)
        elif filter_operator in {">", "<", ">=", "<="}:
            where_sql_parts.append(f'{column_prefix}"{column_name}" {filter_operator} %s')
            query_params.append(filter_value)
        elif filter_operator == "LIKE":
            where_sql_parts.append(f'{column_prefix}"{column_name}" LIKE %s')
            query_params.append(f"%{filter_value}%")
        elif filter_operator == "IN" and isinstance(filter_value, list) and filter_value:
            in_placeholders_sql = ",".join(["%s"] * len(filter_value))
            where_sql_parts.append(f'{column_prefix}"{column_name}" IN ({in_placeholders_sql})')
            query_params.extend(filter_value)

    return where_sql_parts, query_params


def _get_direct_table_relations(table_key: str):
    schema_name, table_name = _split_table_key(table_key)

    with connection.cursor() as cursor:
        direct_relations_sql = """
            SELECT
                key_usage.table_schema AS from_schema,
                key_usage.table_name AS from_table,
                key_usage.column_name AS from_column,
                constraint_columns.table_schema AS to_schema,
                constraint_columns.table_name AS to_table,
                constraint_columns.column_name AS to_column
            FROM information_schema.table_constraints AS constraints
            JOIN information_schema.key_column_usage AS key_usage
              ON constraints.constraint_name = key_usage.constraint_name
             AND constraints.table_schema = key_usage.table_schema
            JOIN information_schema.constraint_column_usage AS constraint_columns
              ON constraint_columns.constraint_name = constraints.constraint_name
             AND constraint_columns.constraint_schema = constraints.table_schema
            WHERE constraints.constraint_type = 'FOREIGN KEY'
              AND (
                (key_usage.table_schema = %s AND key_usage.table_name = %s)
                OR
                (constraint_columns.table_schema = %s AND constraint_columns.table_name = %s)
              )
            ORDER BY key_usage.table_name, constraint_columns.table_name, key_usage.column_name
        """
        cursor.execute(
            direct_relations_sql,
            [schema_name, table_name, schema_name, table_name],
        )
        relation_rows = cursor.fetchall()

    relations_by_related_table = {}
    for from_schema_name, from_table_name, from_column_name, to_schema_name, to_table_name, to_column_name in relation_rows:
        from_table_key = _compose_table_key(from_schema_name, from_table_name)
        to_table_key = _compose_table_key(to_schema_name, to_table_name)

        if from_table_key == table_key:
            related_table_key = to_table_key
            relation_definition = {
                "key": related_table_key,
                "name": _humanize_identifier(to_table_name),
                "base_column": from_column_name,
                "related_column": to_column_name,
                "direction": "outgoing",
            }
        else:
            related_table_key = from_table_key
            relation_definition = {
                "key": related_table_key,
                "name": _humanize_identifier(from_table_name),
                "base_column": to_column_name,
                "related_column": from_column_name,
                "direction": "incoming",
            }

        relations_by_related_table.setdefault(related_table_key, relation_definition)

    return relations_by_related_table


def _fetch_relational_report_rows(report):
    base_table_key, selected_related_table_keys, selected_columns, selected_filters = _build_report_query_definition(report)

    if not base_table_key:
        return None, None, None, "Tabela base inválida."

    direct_relations_by_table = _get_direct_table_relations(base_table_key)
    invalid_related_table_keys = [
        related_table_key
        for related_table_key in selected_related_table_keys
        if related_table_key not in direct_relations_by_table
    ]
    if invalid_related_table_keys:
        return None, None, None, (
            f"Tabela base recebida: {base_table_key}. "
            f"Tabelas relacionadas recebidas: {selected_related_table_keys}. "
            f"Tabelas relacionadas inválidas: {invalid_related_table_keys}. "
            f"Tabelas permitidas: {list(direct_relations_by_table.keys())}."
        )

    allowed_columns_by_table = _build_allowed_columns_map(base_table_key, selected_related_table_keys)

    if not allowed_columns_by_table.get(base_table_key):
        return None, None, None, "Tabela base inválida."

    invalid_columns = [
        selected_column
        for selected_column in selected_columns
        if selected_column["table"] not in allowed_columns_by_table
        or selected_column["column"] not in allowed_columns_by_table[selected_column["table"]]
    ]
    if invalid_columns:
        return None, None, None, (
            f"Tabela base recebida: {base_table_key}. "
            f"Colunas recebidas: {selected_columns}. "
            f"Colunas inválidas: {invalid_columns}."
        )

    if not selected_columns:
        return None, None, None, "Deve selecionar pelo menos uma coluna válida."

    invalid_filters = [
        selected_filter
        for selected_filter in selected_filters
        if selected_filter["table"] not in allowed_columns_by_table
        or selected_filter["column"] not in allowed_columns_by_table[selected_filter["table"]]
    ]
    if invalid_filters:
        return None, None, None, (
            f"Tabela base recebida: {base_table_key}. "
            f"Filtros inválidos: {invalid_filters}."
        )

    filter_value_error = _validate_filter_values(selected_filters, allowed_columns_by_table)
    if filter_value_error:
        return None, None, None, filter_value_error

    print(f"[DEBUG] _fetch_relational_report_rows - Base table: {base_table_key}")
    print(f"[DEBUG] _fetch_relational_report_rows - Related tables: {selected_related_table_keys}")
    print(f"[DEBUG] _fetch_relational_report_rows - Columns requested: {selected_columns}")

    sql_alias_by_table = {base_table_key: "t0"}
    for related_table_index, related_table_key in enumerate(selected_related_table_keys, start=1):
        sql_alias_by_table[related_table_key] = f"t{related_table_index}"

    include_table_prefix_in_header = len([base_table_key, *selected_related_table_keys]) > 1
    used_header_names = set()
    select_sql_parts = []
    result_headers = []

    for selected_column in selected_columns:
        source_table_key = selected_column["table"]
        source_column_name = selected_column["column"]
        source_table_name = _split_table_key(source_table_key)[1]
        result_header_name = f"{source_table_name}.{source_column_name}" if include_table_prefix_in_header else source_column_name
        if result_header_name in used_header_names:
            suffix = 2
            while f"{result_header_name}_{suffix}" in used_header_names:
                suffix += 1
            result_header_name = f"{result_header_name}_{suffix}"
        used_header_names.add(result_header_name)
        result_headers.append(result_header_name)
        select_sql_parts.append(
            f'{sql_alias_by_table[source_table_key]}."{source_column_name}" AS "{result_header_name}"'
        )

    join_sql_parts = []
    base_table_alias = sql_alias_by_table[base_table_key]
    for related_table_key in selected_related_table_keys:
        relation_definition = direct_relations_by_table[related_table_key]
        related_table_alias = sql_alias_by_table[related_table_key]
        if relation_definition["direction"] == "outgoing":
            join_condition_sql = (
                f'{base_table_alias}."{relation_definition["base_column"]}" = '
                f'{related_table_alias}."{relation_definition["related_column"]}"'
            )
        else:
            join_condition_sql = (
                f'{related_table_alias}."{relation_definition["related_column"]}" = '
                f'{base_table_alias}."{relation_definition["base_column"]}"'
            )

        join_sql_parts.append(
            f"LEFT JOIN {_quote_table_ref(related_table_key)} {related_table_alias} ON {join_condition_sql}"
        )

    where_sql_parts, query_params = _build_filter_sql_parts(
        selected_filters,
        allowed_columns_by_table,
        sql_alias_by_table,
    )

    where_clause_sql = f"WHERE {' AND '.join(where_sql_parts)}" if where_sql_parts else ""
    join_clause_sql = " ".join(join_sql_parts)
    report_query_sql = (
        f"SELECT {', '.join(select_sql_parts)} "
        f"FROM {_quote_table_ref(base_table_key)} {base_table_alias} "
        f"{join_clause_sql} {where_clause_sql} LIMIT 10000"
    ).strip()
    print(f"[DEBUG] _fetch_relational_report_rows - SQL: {report_query_sql}")

    result_rows = []
    with connection.cursor() as cursor:
        cursor.execute(report_query_sql, query_params)
        result_column_names = [description[0] for description in cursor.description] if cursor.description else result_headers
        for row in cursor.fetchall():
            result_rows.append({result_column_names[index]: row[index] for index in range(len(result_column_names))})

    print(f"[DEBUG] _fetch_relational_report_rows - Fetched {len(result_rows)} rows, colnames: {result_column_names}")
    return result_rows, selected_columns, result_column_names, None


def _fetch_single_table_rows(report):
    base_table_key = report.table
    schema_name, table_name = _split_table_key(base_table_key)

    selected_columns = _normalize_report_columns(report.columns or [], base_table_key)
    _, _, _, selected_filters = _build_report_query_definition(report)

    print(f"[DEBUG] _fetch_single_table_rows - Table: {base_table_key}, Schema: {schema_name}, Columns requested: {selected_columns}")

    allowed_column_names = _get_allowed_columns(base_table_key)
    print(f"[DEBUG] _fetch_single_table_rows - Allowed columns: {allowed_column_names}")

    valid_column_names = [
        selected_column["column"]
        for selected_column in selected_columns
        if selected_column["column"] in allowed_column_names
    ]
    if not valid_column_names:
        print(f"[DEBUG] _fetch_single_table_rows - No valid columns found")
        return None, None, None, "Deve selecionar pelo menos uma coluna valida."

    print(f"[DEBUG] _fetch_single_table_rows - Valid columns: {valid_column_names}")

    filter_value_error = _validate_filter_values(selected_filters, {base_table_key: allowed_column_names})
    if filter_value_error:
        return None, None, None, filter_value_error

    select_columns_sql = ", ".join([f'"{column_name}"' for column_name in valid_column_names])
    from_table_sql = _quote_table_ref(base_table_key)
    where_sql_parts, query_params = _build_filter_sql_parts(
        selected_filters,
        {base_table_key: allowed_column_names},
    )

    where_clause_sql = f"WHERE {' AND '.join(where_sql_parts)}" if where_sql_parts else ""
    report_query_sql = f"SELECT {select_columns_sql} FROM {from_table_sql} {where_clause_sql} LIMIT 10000"
    print(f"[DEBUG] _fetch_single_table_rows - SQL: {report_query_sql}")

    result_rows = []
    with connection.cursor() as cursor:
        cursor.execute(report_query_sql, query_params)
        result_column_names = [description[0] for description in cursor.description] if cursor.description else valid_column_names
        for row in cursor.fetchall():
            result_rows.append({result_column_names[index]: row[index] for index in range(len(result_column_names))})

    print(f"[DEBUG] _fetch_single_table_rows - Fetched {len(result_rows)} rows, colnames: {result_column_names}")
    return result_rows, selected_columns, result_column_names, None


def _count_relational_report_rows(report):
    base_table_key, selected_related_table_keys, selected_columns, selected_filters = _build_report_query_definition(report)

    if not base_table_key:
        return 0, "Tabela base inválida."

    direct_relations_by_table = _get_direct_table_relations(base_table_key)
    invalid_related_table_keys = [
        related_table_key
        for related_table_key in selected_related_table_keys
        if related_table_key not in direct_relations_by_table
    ]
    if invalid_related_table_keys:
        return 0, "Tabelas relacionadas inválidas."

    allowed_columns_by_table = _build_allowed_columns_map(base_table_key, selected_related_table_keys)

    if not allowed_columns_by_table.get(base_table_key):
        return 0, "Tabela base inválida."

    invalid_columns = [
        selected_column
        for selected_column in selected_columns
        if selected_column["table"] not in allowed_columns_by_table
        or selected_column["column"] not in allowed_columns_by_table[selected_column["table"]]
    ]
    if invalid_columns:
        return 0, "Colunas inválidas."

    invalid_filters = [
        selected_filter
        for selected_filter in selected_filters
        if selected_filter["table"] not in allowed_columns_by_table
        or selected_filter["column"] not in allowed_columns_by_table[selected_filter["table"]]
    ]
    if invalid_filters:
        return 0, "Filtros inválidos."

    sql_alias_by_table = {base_table_key: "t0"}
    for related_table_index, related_table_key in enumerate(selected_related_table_keys, start=1):
        sql_alias_by_table[related_table_key] = f"t{related_table_index}"

    join_sql_parts = []
    base_table_alias = sql_alias_by_table[base_table_key]
    for related_table_key in selected_related_table_keys:
        relation_definition = direct_relations_by_table[related_table_key]
        related_table_alias = sql_alias_by_table[related_table_key]
        if relation_definition["direction"] == "outgoing":
            join_condition_sql = (
                f'{base_table_alias}."{relation_definition["base_column"]}" = '
                f'{related_table_alias}."{relation_definition["related_column"]}"'
            )
        else:
            join_condition_sql = (
                f'{related_table_alias}."{relation_definition["related_column"]}" = '
                f'{base_table_alias}."{relation_definition["base_column"]}"'
            )

        join_sql_parts.append(
            f"LEFT JOIN {_quote_table_ref(related_table_key)} {related_table_alias} ON {join_condition_sql}"
        )

    where_sql_parts, query_params = _build_filter_sql_parts(
        selected_filters,
        allowed_columns_by_table,
        sql_alias_by_table,
    )

    where_clause_sql = f"WHERE {' AND '.join(where_sql_parts)}" if where_sql_parts else ""
    join_clause_sql = " ".join(join_sql_parts)
    count_query_sql = (
        f"SELECT COUNT(*) "
        f"FROM {_quote_table_ref(base_table_key)} {base_table_alias} "
        f"{join_clause_sql} {where_clause_sql}"
    ).strip()

    with connection.cursor() as cursor:
        cursor.execute(count_query_sql, query_params)
        return int(cursor.fetchone()[0] or 0), None


def _count_single_table_rows(report):
    base_table_key = report.table
    allowed_column_names = _get_allowed_columns(base_table_key)
    if not allowed_column_names:
        return 0, "Tabela base inválida."

    _, _, _, selected_filters = _build_report_query_definition(report)
    where_sql_parts, query_params = _build_filter_sql_parts(
        selected_filters,
        {base_table_key: allowed_column_names},
    )

    where_clause_sql = f"WHERE {' AND '.join(where_sql_parts)}" if where_sql_parts else ""
    count_query_sql = f"SELECT COUNT(*) FROM {_quote_table_ref(base_table_key)} {where_clause_sql}".strip()

    with connection.cursor() as cursor:
        cursor.execute(count_query_sql, query_params)
        return int(cursor.fetchone()[0] or 0), None


def _is_relational_report(report) -> bool:
    normalized_related_table_keys = _normalize_related_tables(getattr(report, "related_tables", []) or [])
    if normalized_related_table_keys:
        return True

    base_table_key = _normalize_table_key(getattr(report, "base_table", None) or getattr(report, "table", ""))
    normalized_columns = _normalize_report_columns(getattr(report, "columns", []) or [], base_table_key)
    return any(selected_column["table"] != base_table_key for selected_column in normalized_columns)


def _fetch_report_rows(report):
    if _is_relational_report(report):
        return _fetch_relational_report_rows(report)
    return _fetch_single_table_rows(report)


def _count_report_rows(report):
    if _is_relational_report(report):
        return _count_relational_report_rows(report)
    return _count_single_table_rows(report)
