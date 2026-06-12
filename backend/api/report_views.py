import io
from collections import defaultdict

from django.db import connection, connections, DEFAULT_DB_ALIAS
from django.db.models import Q
from django.http import FileResponse, Http404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SavedReport
from .report_exports import (
    _build_json_bytes,
    _build_csv_bytes,
    _build_minimal_pdf,
    _set_download_response_headers,
    _set_pdf_render_context,
)
from .report_services import (
    _build_preview_report_definition,
    _build_report_request_payload,
    _compose_table_key,
    _guess_column_type,
    _humanize_identifier,
    _split_table_key,
)
from .report_sql import (
    _build_allowed_columns_map,
    _count_report_rows,
    _fetch_report_rows,
)
from .serializers import SavedReportSerializer


def _quote_table_identifier(schema_name: str, table_name: str) -> str:
    quote_name = connection.ops.quote_name
    return f"{quote_name(schema_name)}.{quote_name(table_name)}"


class EntityListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search_query = request.query_params.get("q", "").strip().lower()
        schema_name = request.query_params.get("schema", "public").strip() or "public"

        with connection.cursor() as cursor:
            table_summary_sql = """
                SELECT
                    tables.table_schema,
                    tables.table_name,
                    COALESCE(table_stats.n_live_tup::bigint, pg_class.reltuples::bigint, 0) AS estimated_rows
                FROM information_schema.tables AS tables
                LEFT JOIN pg_catalog.pg_class
                    ON pg_class.relname = tables.table_name
                LEFT JOIN pg_catalog.pg_namespace AS namespaces
                    ON namespaces.oid = pg_class.relnamespace
                   AND namespaces.nspname = tables.table_schema
                LEFT JOIN pg_catalog.pg_stat_user_tables AS table_stats
                    ON table_stats.schemaname = tables.table_schema
                   AND table_stats.relname = tables.table_name
                WHERE tables.table_schema = %s
                  AND tables.table_type IN ('BASE TABLE', 'VIEW')
                ORDER BY tables.table_name
            """
            cursor.execute(table_summary_sql, [schema_name])
            table_summary_rows = cursor.fetchall()
            table_row_counts = {}
            for table_schema_name, table_name, estimated_rows in table_summary_rows:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {_quote_table_identifier(table_schema_name, table_name)}")
                    table_row_counts[(table_schema_name, table_name)] = int(cursor.fetchone()[0] or 0)
                except Exception:
                    table_row_counts[(table_schema_name, table_name)] = int(estimated_rows or 0)

            table_columns_sql = """
                SELECT
                    table_name,
                    column_name,
                    data_type,
                    udt_name
                FROM information_schema.columns
                WHERE table_schema = %s
                ORDER BY table_name, ordinal_position
            """
            cursor.execute(table_columns_sql, [schema_name])
            table_column_rows = cursor.fetchall()

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
                  AND key_usage.table_schema = %s
                  AND constraint_columns.table_schema = %s
                ORDER BY key_usage.table_name, constraint_columns.table_name, key_usage.column_name
            """
            cursor.execute(direct_relations_sql, [schema_name, schema_name])
            relation_rows = cursor.fetchall()

        columns_by_table = defaultdict(list)
        for table_name, column_name, data_type, udt_name in table_column_rows:
            columns_by_table[table_name].append(
                {
                    "n": column_name,
                    "label": _humanize_identifier(column_name),
                    "type": _guess_column_type(data_type, udt_name),
                }
            )

        relations_by_table = defaultdict(dict)
        for from_schema, from_table, from_column, to_schema, to_table, to_column in relation_rows:
            from_key = _compose_table_key(from_schema, from_table)
            to_key = _compose_table_key(to_schema, to_table)

            relations_by_table[from_key].setdefault(
                to_key,
                {
                    "key": to_key,
                    "name": _humanize_identifier(to_table),
                    "from_column": from_column,
                    "to_column": to_column,
                    "direction": "outgoing",
                },
            )
            relations_by_table[to_key].setdefault(
                from_key,
                {
                    "key": from_key,
                    "name": _humanize_identifier(from_table),
                    "from_column": to_column,
                    "to_column": from_column,
                    "direction": "incoming",
                },
            )

        entity_definitions = []
        for table_schema_name, table_name, estimated_rows in table_summary_rows:
            table_key = _compose_table_key(table_schema_name, table_name)
            table_label = _humanize_identifier(table_name)

            if search_query and search_query not in table_key.lower() and search_query not in table_label.lower():
                continue

            table_columns = columns_by_table.get(table_name, [])
            entity_definitions.append(
                {
                    "key": table_key,
                    "schema": table_schema_name,
                    "name": table_label,
                    "rows": table_row_counts.get((table_schema_name, table_name), int(estimated_rows or 0)),
                    "cols": len(table_columns),
                    "columns": table_columns,
                    "related_tables": list(relations_by_table.get(table_key, {}).values()),
                }
            )

        return Response(entity_definitions)


class SchemaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        database_connection = connections[DEFAULT_DB_ALIAS]
        database_introspection = database_connection.introspection
        tables_payload = []

        with database_connection.cursor() as cursor:
            table_names = database_introspection.table_names(cursor)

            for table_name in table_names:
                columns_payload = []
                relations_payload = []

                table_description = database_introspection.get_table_description(cursor, table_name)
                for column in table_description:
                    try:
                        column_type = database_introspection.get_field_type(column.type_code, column)
                    except Exception:
                        column_type = str(column.type_code)

                    columns_payload.append(
                        {
                            "name": column.name,
                            "type": column_type,
                            "nullable": bool(getattr(column, "null_ok", False)),
                        }
                    )

                table_constraints = database_introspection.get_constraints(cursor, table_name)
                for constraint_definition in table_constraints.values():
                    foreign_key = constraint_definition.get("foreign_key")
                    source_columns = constraint_definition.get("columns") or []

                    if not foreign_key or not source_columns:
                        continue

                    target_table_name, target_column_name = foreign_key
                    relations_payload.append(
                        {
                            "from_column": source_columns[0],
                            "to_table": target_table_name,
                            "to_column": target_column_name,
                        }
                    )

                tables_payload.append(
                    {
                        "table": table_name,
                        "columns": columns_payload,
                        "relations": relations_payload,
                    }
                )

        return Response({"tables": tables_payload})


class ReportsListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved_reports = SavedReport.objects.filter(Q(owner=request.user) | Q(is_public=True)).distinct()
        serializer = SavedReportSerializer(saved_reports, many=True)
        return Response(serializer.data)

    def post(self, request):
        report_request_payload = _build_report_request_payload(request.data)
        report_name = request.data.get("name")
        report_description = request.data.get("description") or ""
        is_public = bool(request.data.get("is_public", False))

        if not report_name or not report_name.strip():
            return Response({"error": "O nome do relatório é obrigatório."}, status=400)

        if not report_request_payload["base_table_key"] or not report_request_payload["base_table_key"].strip():
            return Response({"error": "Deve selecionar uma tabela de dados."}, status=400)

        if not isinstance(report_request_payload["raw_column_definitions"], list) or len(report_request_payload["normalized_columns"]) == 0:
            return Response({"error": "Deve selecionar pelo menos uma coluna."}, status=400)

        print("REQUEST DATA:", request.data)
        print("TABLE:", report_request_payload["base_table_key"])
        print("RAW COLUMNS:", report_request_payload["raw_column_definitions"])
        print("NORMALIZED COLUMNS:", report_request_payload["normalized_columns"])
        print(
            "ALLOWED COLUMNS:",
            _build_allowed_columns_map(
                report_request_payload["base_table_key"],
                report_request_payload["selected_related_table_keys"],
            ),
        )

        preview_report_definition = _build_preview_report_definition(report_request_payload)
        _, _, _, fetch_error = _fetch_report_rows(preview_report_definition)
        if fetch_error:
            return Response({"error": fetch_error}, status=400)

        record_count, count_error = _count_report_rows(preview_report_definition)
        if count_error:
            return Response({"error": count_error}, status=400)

        saved_report = SavedReport.objects.create(
            owner=request.user,
            name=report_name.strip(),
            description=report_description.strip(),
            table=report_request_payload["base_table_key"],
            related_tables=report_request_payload["selected_related_table_keys"],
            columns=report_request_payload["normalized_columns"],
            filters=report_request_payload["normalized_filters"],
            is_public=is_public,
            record_count=record_count,
        )

        return Response(SavedReportSerializer(saved_report).data, status=201)


class ReportPreviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        report_request_payload = _build_report_request_payload(request.data)

        if not report_request_payload["base_table_key"]:
            return Response({"error": "Deve selecionar uma tabela de dados."}, status=400)

        if not isinstance(report_request_payload["raw_column_definitions"], list) or len(report_request_payload["normalized_columns"]) == 0:
            return Response({"error": "Deve selecionar pelo menos uma coluna."}, status=400)

        print("REQUEST DATA:", request.data)
        print("TABLE:", report_request_payload["base_table_key"])
        print("RAW COLUMNS:", report_request_payload["raw_column_definitions"])
        print("NORMALIZED COLUMNS:", report_request_payload["normalized_columns"])
        print(
            "ALLOWED COLUMNS:",
            _build_allowed_columns_map(
                report_request_payload["base_table_key"],
                report_request_payload["selected_related_table_keys"],
            ),
        )

        preview_report_definition = _build_preview_report_definition(report_request_payload)
        preview_rows, _, preview_column_names, fetch_error = _fetch_report_rows(preview_report_definition)

        if fetch_error:
            return Response({"error": fetch_error}, status=400)

        return Response(
            {
                "columns": preview_column_names,
                "rows": preview_rows[:10],
                "total_preview_rows": min(len(preview_rows), 10),
            }
        )


class ReportDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            saved_report = SavedReport.objects.get(id=pk, owner=request.user)
        except SavedReport.DoesNotExist:
            raise Http404("Report not found")

        saved_report.delete()
        return Response(status=204)


class ReportDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        export_format = request.query_params.get("export_format")

        if not export_format:
            return Response({"error": "Formato não especificado."}, status=400)

        export_format = export_format.lower().strip()
        if export_format not in ["json", "csv", "pdf"]:
            return Response({"error": "Formato não suportado."}, status=400)

        saved_report = SavedReport.objects.filter(id=pk).first()
        if not saved_report:
            return Response({"error": "Relatório não encontrado."}, status=404)
        if saved_report.owner_id != request.user.id and not saved_report.is_public:
            return Response({"error": "Sem permissão para este relatório."}, status=403)

        result_rows, _, result_column_names, fetch_error = _fetch_report_rows(saved_report)
        if fetch_error:
            return Response({"error": fetch_error}, status=400)

        safe_report_name = saved_report.name.replace("/", "_").replace("\\", "_")

        if export_format == "json":
            json_bytes = _build_json_bytes(result_rows)
            response = FileResponse(
                io.BytesIO(json_bytes),
                as_attachment=True,
                filename=f"{safe_report_name}.json",
                content_type="application/json",
            )
            _set_download_response_headers(response, f"{safe_report_name}.json")
            return response

        if export_format == "csv":
            csv_bytes = _build_csv_bytes(result_column_names, result_rows)
            response = FileResponse(
                io.BytesIO(csv_bytes),
                as_attachment=True,
                filename=f"{safe_report_name}.csv",
                content_type="text/csv; charset=utf-8",
            )
            _set_download_response_headers(response, f"{safe_report_name}.csv")
            return response

        owner_name = (
            f"{(getattr(saved_report.owner, 'first_name', '') or '').strip()} {(getattr(saved_report.owner, 'last_name', '') or '').strip()}".strip()
            or getattr(saved_report.owner, "username", "")
            or getattr(saved_report.owner, "email", "")
            or "Sistema"
        )
        included_table_keys = [saved_report.table, *(saved_report.related_tables or [])]
        selected_column_count_by_table = defaultdict(int)
        for selected_column in saved_report.columns or []:
            if isinstance(selected_column, dict):
                selected_table_key = selected_column.get("table") or saved_report.table
            else:
                selected_table_key = saved_report.table

            if selected_table_key:
                selected_column_count_by_table[selected_table_key] += 1

        included_report_tables = [
            {
                "name": _humanize_identifier(_split_table_key(table_key)[1]),
                "key": table_key,
                "column_count": selected_column_count_by_table.get(table_key, 0),
                "description": "Tabela incluída no relatório.",
            }
            for table_key in included_table_keys
            if table_key
        ]
        _set_pdf_render_context(
            {
                "report_id": str(saved_report.id),
                "user_name": owner_name,
                "report_type": saved_report.name,
                "report_description": saved_report.description.strip() or "Relatório exportado com base nos dados selecionados.",
                "report_tables": included_report_tables,
            }
        )
        pdf_bytes = _build_minimal_pdf(
            safe_report_name,
            result_column_names,
            result_rows,
        )

        response = FileResponse(
            io.BytesIO(pdf_bytes),
            as_attachment=True,
            filename=f"{safe_report_name}.pdf",
            content_type="application/pdf",
        )
        _set_download_response_headers(response, f"{safe_report_name}.pdf")
        return response
