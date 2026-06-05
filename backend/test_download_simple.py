#!/usr/bin/env python
"""
Teste simples do download - ve exatamente onde está o problema
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import SavedReport

User = get_user_model()

print("[TEST] Verificando relatórios na BD...")
print("="*80)

user = User.objects.first()
if not user:
    print("[ERROR] Nenhum utilizador encontrado")
    sys.exit(1)

reports = SavedReport.objects.filter(owner=user).order_by('-created_at')
print(f"[TEST] Total de relatórios: {reports.count()}")

for i, report in enumerate(reports[:5], 1):
    print(f"\n[TEST] Relatório #{i}")
    print(f"  ID: {report.id}")
    print(f"  Nome: {report.name}")
    print(f"  Tabela: {report.table}")
    print(f"  file_csv na BD: {report.file_csv}")
    print(f"  file_pdf na BD: {report.file_pdf}")
    print(f"  file_json na BD: {report.file_json}")

    # Verificar se ficheiros existem
    if report.file_csv:
        exists = os.path.exists(report.file_csv)
        print(f"  CSV existe? {exists}")
        if exists:
            print(f"    Tamanho: {os.path.getsize(report.file_csv)} bytes")

    if report.file_pdf:
        exists = os.path.exists(report.file_pdf)
        print(f"  PDF existe? {exists}")
        if exists:
            print(f"    Tamanho: {os.path.getsize(report.file_pdf)} bytes")

    if report.file_json:
        exists = os.path.exists(report.file_json)
        print(f"  JSON existe? {exists}")
        if exists:
            print(f"    Tamanho: {os.path.getsize(report.file_json)} bytes")

print("\n" + "="*80)

