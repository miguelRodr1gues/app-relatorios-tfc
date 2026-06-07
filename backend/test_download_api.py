#!/usr/bin/env python
"""
Manual smoke test for report downloads.

Exports are generated in memory by the API and returned directly in the HTTP
response. No file paths are stored in SavedReport.
"""
import os
import sys

import django
from django.contrib.auth import get_user_model
from django.test import Client

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import SavedReport


User = get_user_model()


def main():
    print("[TEST] Testing in-memory report downloads...")
    print("=" * 80)

    user = User.objects.first()
    if not user:
        print("[ERROR] No user found")
        sys.exit(1)

    report = SavedReport.objects.filter(owner=user).first()
    if not report:
        print("[ERROR] No report found")
        sys.exit(1)

    print(f"[TEST] User: {getattr(user, 'email', user.pk)}")
    print(f"[TEST] Report: {report.id} - {report.name}")

    client = Client()
    client.force_login(user)

    for export_format in ["csv", "pdf", "json"]:
        print(f"\n[TEST] Download {export_format.upper()}...")
        response = client.get(
            f"/api/reports/{report.id}/download/",
            {"export_format": export_format},
        )

        print(f"[TEST] Status: {response.status_code}")
        if response.status_code != 200:
            print(f"[ERROR] Response: {response.content!r}")
            continue

        content = b"".join(response.streaming_content) if getattr(response, "streaming", False) else response.content
        print("[TEST] OK")
        print(f"[TEST] Content-Type: {response.get('Content-Type', 'unknown')}")
        print(f"[TEST] Content-Disposition: {response.get('Content-Disposition', 'missing')}")
        print(f"[TEST] Size: {len(content)} bytes")

    print("\n" + "=" * 80)
    print("[TEST] Done")


if __name__ == "__main__":
    main()
