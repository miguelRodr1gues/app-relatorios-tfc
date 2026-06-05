#!/usr/bin/env python
"""
Script para testar o download real via API
"""
import os
import sys
import django
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import SavedReport
from django.conf import settings

User = get_user_model()

print("[TEST] Testando download via API...")
print("="*80)

# Obter utilizador
user = User.objects.first()
if not user:
    print("[ERROR] Nenhum utilizador encontrado")
    sys.exit(1)

print(f"[TEST] Utilizador: {user.email}")

# Obter relatório criado
try:
    report = SavedReport.objects.filter(owner=user, name="Test Report CSV PDF").first()
    if not report:
        print("[ERROR] Relatório de teste não encontrado")
        sys.exit(1)

    print(f"[TEST] Relatório: {report.id}")
    print(f"[TEST] CSV path na BD: {report.file_csv}")
    print(f"[TEST] PDF path na BD: {report.file_pdf}")
except Exception as e:
    print(f"[ERROR] Erro ao buscar relatório: {e}")
    sys.exit(1)

# Criar cliente HTTP
client = Client()

# Testar downloads
for fmt in ["csv", "pdf", "json"]:
    print(f"\n[TEST] Testando download {fmt.upper()}...")

    try:
        # Simular autenticação (usar cookies se disponível)
        response = client.get(
            f'/api/reports/{report.id}/download/',
            {'format': fmt},
            HTTP_ACCEPT='application/json'
        )

        print(f"[TEST] Status: {response.status_code}")

        if response.status_code == 200:
            content_length = len(response.content)
            content_type = response.get('Content-Type', 'unknown')
            print(f"[TEST] ✅ Download bem-sucedido!")
            print(f"[TEST] Content-Type: {content_type}")
            print(f"[TEST] Tamanho: {content_length} bytes")
        elif response.status_code == 404:
            print(f"[ERROR] ❌ 404 Not Found")
            print(f"[ERROR] A resposta foi: {response.content}")
        elif response.status_code == 401:
            print(f"[ERROR] ❌ 401 Unauthorized - Não autenticado")
        else:
            print(f"[ERROR] ❌ Status {response.status_code}")
            print(f"[ERROR] Resposta: {response.content}")

    except Exception as e:
        print(f"[ERROR] Erro ao fazer download: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "="*80)
print("[TEST] Teste de download concluído!")

