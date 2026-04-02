from django.apps import apps
from django.db import connection
from rest_framework.response import Response
from rest_framework.views import APIView

class EntityListAPIView(APIView):
    """
    Lista tabelas reais da base PostgreSQL (inclui as criadas fora do Django).
    Query params:
      - q: filtro por nome da tabela
      - schema: filtrar schema (default: public)
    """
    def get(self, request):
        query = (request.query_params.get("q") or "").strip().lower()
        schema = (request.query_params.get("schema") or "public").strip()

        sql = """
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_type = 'BASE TABLE'
              AND table_schema = %s
            ORDER BY table_name;
        """

        with connection.cursor() as cursor:
            cursor.execute(sql, [schema])
            rows = cursor.fetchall()

        tables = [
            {"schema": row[0], "table_name": row[1]}
            for row in rows
            if not query or query in row[1].lower()
        ]
        return Response(tables)