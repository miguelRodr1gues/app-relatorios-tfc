#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import SavedReport
from api.views import _fetch_report_rows, _write_csv_report, _write_pdf_report
from django.conf import settings

User = get_user_model()

print("[TEST] Iniciando teste de geração de relatórios")
print("=" * 80)

# ---------------- USER ----------------
user = User.objects.first()
if not user:
    user = User.objects.create_user(username="testuser", email="test@example.com")

print(f"[TEST] User: {user.email}")

# ---------------- REPORT ----------------
report = SavedReport.objects.create(
    owner=user,
    name="Test Report",
    table="actividadescafe",
    columns=["id", "timestamp"],
    filters=[],
    description="teste"
)

print(f"[TEST] Report criado: {report.id}")

# ---------------- FETCH DATA ----------------
rows, cols, colnames, error = _fetch_report_rows(report)

if error:
    print(f"[ERROR] {error}")
    sys.exit(1)

print(f"[TEST] Rows: {len(rows)}")

# ---------------- OUTPUT DIR ----------------
out_dir = os.path.join(settings.BASE_DIR, "generated_files")
os.makedirs(out_dir, exist_ok=True)

print(f"[TEST] Pasta: {out_dir}")

# ---------------- CSV ----------------
csv_path = os.path.join(out_dir, f"{report.id}.csv")

print("[TEST] Gerar CSV...")
_write_csv_report(csv_path, colnames, rows)

if os.path.exists(csv_path):
    print(f"[OK] CSV criado: {csv_path}")
else:
    print("[ERROR] CSV não criado")

# ---------------- PDF ----------------
pdf_path = os.path.join(out_dir, f"{report.id}.pdf")

print("[TEST] Gerar PDF...")
_write_pdf_report(pdf_path, report.name, colnames, rows)

if os.path.exists(pdf_path):
    print(f"[OK] PDF criado: {pdf_path}")
else:
    print("[ERROR] PDF não criado")

# ---------------- VERIFY ----------------
print("\n[TEST] Verificação final:")
print("CSV existe:", os.path.exists(csv_path))
print("PDF existe:", os.path.exists(pdf_path))

print("\n[TEST] CONCLUÍDO")