from types import SimpleNamespace


def _humanize_identifier(identifier: str) -> str:
    return identifier.replace("_", " ").strip().title() or identifier


def _guess_column_type(data_type: str, udt_name: str) -> str:
    normalized_type = (data_type or udt_name or "").lower()

    if normalized_type in {
        "smallint",
        "integer",
        "bigint",
        "decimal",
        "numeric",
        "real",
        "double precision",
    }:
        return "number"
    if normalized_type in {
        "date",
        "timestamp without time zone",
        "timestamp with time zone",
        "time without time zone",
        "time with time zone",
    }:
        return "date"
    if normalized_type in {"boolean"}:
        return "text"
    return "text"


def _split_table_key(table_key: str):
    normalized_table_key = (table_key or "").strip()
    if "." in normalized_table_key:
        schema_name, table_name = normalized_table_key.split(".", 1)
        return schema_name.strip() or "public", table_name.strip()
    return "public", normalized_table_key


def _compose_table_key(schema_name: str, table_name: str) -> str:
    normalized_schema_name = (schema_name or "public").strip() or "public"
    normalized_table_name = (table_name or "").strip()
    return normalized_table_name if normalized_schema_name == "public" else f"{normalized_schema_name}.{normalized_table_name}"


def _normalize_table_key(table_key):
    if not isinstance(table_key, str):
        return ""
    schema_name, table_name = _split_table_key(table_key)
    return _compose_table_key(schema_name, table_name)


def _normalize_report_column(column_definition):
    if isinstance(column_definition, dict):
        column_definition = (
            column_definition.get("column")
            or column_definition.get("n")
            or column_definition.get("name")
            or column_definition.get("key")
        )
    if isinstance(column_definition, str):
        normalized_column_name = column_definition.strip()
        if "::" in normalized_column_name:
            normalized_column_name = normalized_column_name.split("::", 1)[-1]
        elif "." in normalized_column_name:
            normalized_column_name = normalized_column_name.split(".")[-1]
        return normalized_column_name
    return column_definition


def _normalize_report_column_selection(column_definition, default_table_key: str):
    if isinstance(column_definition, dict):
        selected_table_key = _normalize_table_key(column_definition.get("table") or default_table_key)
        selected_column_name = _normalize_report_column(
            column_definition.get("column")
            or column_definition.get("n")
            or column_definition.get("name")
            or column_definition.get("key")
        )
    else:
        selected_table_key = _normalize_table_key(default_table_key)
        selected_column_name = _normalize_report_column(column_definition)

    if not selected_table_key or not selected_column_name:
        return None

    return {
        "table": selected_table_key,
        "column": selected_column_name,
    }


def _normalize_report_columns(column_definitions, default_table_key: str = ""):
    return [
        normalized_column
        for normalized_column in (
            _normalize_report_column_selection(column_definition, default_table_key)
            for column_definition in (column_definitions or [])
        )
        if normalized_column
    ]


def _normalize_report_filter(raw_filter, default_table_key: str = ""):
    if not isinstance(raw_filter, dict):
        return None

    normalized_filter = dict(raw_filter)
    normalized_filter["table"] = _normalize_table_key(raw_filter.get("table") or default_table_key)
    normalized_filter["column"] = _normalize_report_column(raw_filter.get("column"))
    return normalized_filter if normalized_filter["table"] and normalized_filter["column"] else None


def _normalize_report_filters(raw_filters, default_table_key: str = ""):
    return [
        normalized_filter
        for normalized_filter in (
            _normalize_report_filter(raw_filter, default_table_key)
            for raw_filter in (raw_filters or [])
        )
        if normalized_filter
    ]


def _normalize_related_tables(related_table_keys):
    normalized_related_table_keys = []
    seen_table_keys = set()
    for related_table_key in related_table_keys or []:
        normalized_table_key = _normalize_table_key(related_table_key)
        if normalized_table_key and normalized_table_key not in seen_table_keys:
            seen_table_keys.add(normalized_table_key)
            normalized_related_table_keys.append(normalized_table_key)
    return normalized_related_table_keys


def _build_report_query_definition(report):
    base_table_key = _normalize_table_key(getattr(report, "base_table", None) or getattr(report, "table", ""))
    selected_related_table_keys = _normalize_related_tables(getattr(report, "related_tables", []) or [])
    selected_columns = _normalize_report_columns(getattr(report, "columns", []) or [], base_table_key)
    selected_filters = _normalize_report_filters(getattr(report, "filters", []) or [], base_table_key)

    return base_table_key, selected_related_table_keys, selected_columns, selected_filters


def _build_report_request_payload(request_data):
    base_table_key = _normalize_table_key(request_data.get("base_table") or request_data.get("table"))
    selected_related_table_keys = _normalize_related_tables(request_data.get("related_tables") or [])
    raw_column_definitions = request_data.get("columns") or []
    normalized_columns = _normalize_report_columns(raw_column_definitions, base_table_key)
    normalized_filters = _normalize_report_filters(request_data.get("filters") or [], base_table_key)

    return {
        "base_table_key": base_table_key,
        "selected_related_table_keys": selected_related_table_keys,
        "raw_column_definitions": raw_column_definitions,
        "normalized_columns": normalized_columns,
        "normalized_filters": normalized_filters,
    }


def _build_preview_report_definition(report_request_payload):
    return SimpleNamespace(
        table=report_request_payload["base_table_key"],
        related_tables=report_request_payload["selected_related_table_keys"],
        columns=report_request_payload["normalized_columns"],
        filters=report_request_payload["normalized_filters"],
    )
