#!/usr/bin/env python
"""
Regenerar ficheiros para relatório existente
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import SavedReport
from api.views import _fetch_report_rows, _write_csv_report, _write_pdf_report
import json
from django.conf import settings

User = get_user_model()

print("[REGEN] Regenerando ficheiros para relatórios...")
print("="*80)

user = User.objects.first()
if not user:
    print("[ERROR] Nenhum utilizador encontrado")
    sys.exit(1)

reports = SavedReport.objects.filter(owner=user)
print(f"[REGEN] Total de relatórios: {reports.count()}")

for report in reports:
    print(f"\n[REGEN] Processando: {report.name} ({report.id})")

    try:
        # Buscar dados
        rows, cols, colnames, error = _fetch_report_rows(report)
        if error:
            print(f"[ERROR] Erro ao buscar dados: {error}")
            continue

        print(f"[REGEN] Dados obtidos: {len(rows)} linhas")

        # Diretório
        out_dir = os.path.join(settings.BASE_DIR, "generated_reports")
        os.makedirs(out_dir, exist_ok=True)

        # JSON
        print(f"[REGEN] Gerando JSON...")
        json_path = os.path.join(out_dir, f"{report.id}.json")
        with open(json_path, "w", encoding="utf-8") as jf:
            json.dump(rows, jf, default=str, ensure_ascii=False, indent=2)
        report.file_json = json_path
        print(f"[REGEN] ✅ JSON: {os.path.getsize(json_path)} bytes")

        # CSV
        print(f"[REGEN] Gerando CSV...")
        csv_path = os.path.join(out_dir, f"{report.id}.csv")
        _write_csv_report(csv_path, colnames, rows)
        report.file_csv = csv_path
        print(f"[REGEN] ✅ CSV: {os.path.getsize(csv_path)} bytes")

        # PDF
        print(f"[REGEN] Gerando PDF...")
        pdf_path = os.path.join(out_dir, f"{report.id}.pdf")
        _write_pdf_report(pdf_path, report.name, colnames, rows)
        report.file_pdf = pdf_path
        print(f"[REGEN] ✅ PDF: {os.path.getsize(pdf_path)} bytes")

        # Salvar
        print(f"[REGEN] Guardando na BD...")
        report.save(update_fields=["file_json", "file_csv", "file_pdf"])
        print(f"[REGEN] ✅ Relatório guardado!")

    except Exception as e:
        print(f"[ERROR] Erro: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "="*80)
print("[REGEN] Regeneração concluída!")

