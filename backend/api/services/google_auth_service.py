from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
import requests


@dataclass(frozen=True)
class GoogleUserInfo:
    sub: str
    email: str
    name: str = ""
    picture: str = ""


def verify_google_id_token(id_token: str) -> GoogleUserInfo:
    """Validate a Google ID token (JWT) and extract basic profile info.

    Raises:
        ValueError: when the token is invalid/expired or audience mismatch.
    """

    client_id = getattr(settings, "GOOGLE_CLIENT_ID", None)
    if not client_id:
        raise ValueError("Missing settings.GOOGLE_CLIENT_ID")

    request = google_requests.Request()
    payload = google_id_token.verify_oauth2_token(id_token, request, client_id)

    # Basic issuer hardening (verify_oauth2_token already checks this in most cases)
    iss = payload.get("iss")
    if iss not in ("accounts.google.com", "https://accounts.google.com"):
        raise ValueError("Invalid issuer")

    email = payload.get("email")
    sub = payload.get("sub")
    if not email or not sub:
        raise ValueError("Token missing required claims")

    return GoogleUserInfo(
        sub=str(sub),
        email=str(email),
        name=str(payload.get("name") or ""),
        picture=str(payload.get("picture") or ""),
    )


def verify_google_access_token(access_token: str) -> GoogleUserInfo:
    """Validate a Google OAuth access token by calling the userinfo endpoint."""

    response = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()

    email = payload.get("email")
    sub = payload.get("sub") or payload.get("id")
    if not email or not sub:
        raise ValueError("Token missing required claims")

    return GoogleUserInfo(
        sub=str(sub),
        email=str(email),
        name=str(payload.get("name") or ""),
        picture=str(payload.get("picture") or ""),
    )


