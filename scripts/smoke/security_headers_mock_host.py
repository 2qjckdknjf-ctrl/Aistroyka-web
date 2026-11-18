#!/usr/bin/env python3
"""Local mocked-host harness for security_headers.sh redirect-hop contracts.

Usage:
  python3 scripts/smoke/security_headers_mock_host.py ok
  python3 scripts/smoke/security_headers_mock_host.py early-hints
  python3 scripts/smoke/security_headers_mock_host.py missing-redirect-csp
  python3 scripts/smoke/security_headers_mock_host.py joined-duplicates
  python3 scripts/smoke/security_headers_mock_host.py joined-api-duplicates

Exit code mirrors the smoke script (0 for healthy modes with full PASS).
"""
from __future__ import annotations

import os
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Dict

ROOT = Path(__file__).resolve().parents[2]

PAGE_HEADERS: Dict[str, str] = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-frame-options": "DENY",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "content-security-policy": "default-src 'self'; script-src 'self'; frame-ancestors 'none';",
    "strict-transport-security": "max-age=31536000; includeSubdomains; preload",
}

API_HEADERS: Dict[str, str] = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-frame-options": "DENY",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
}

JOINED_PAGE_HEADERS: Dict[str, str] = {
    "x-content-type-options": "nosniff, nosniff",
    "referrer-policy": "strict-origin-when-cross-origin, strict-origin-when-cross-origin",
    "x-frame-options": "DENY, DENY",
    "permissions-policy": (
        "camera=(), microphone=(), geolocation=(), interest-cohort=(), "
        "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    ),
    "content-security-policy": (
        "default-src 'self'; script-src 'self'; frame-ancestors 'none';, "
        "default-src 'self'; script-src 'self'; frame-ancestors 'none';"
    ),
    "strict-transport-security": (
        "max-age=31536000; includeSubdomains; preload, "
        "max-age=31536000; includeSubdomains; preload"
    ),
}

JOINED_API_HEADERS: Dict[str, str] = {
    "x-content-type-options": "nosniff, nosniff",
    "referrer-policy": "strict-origin-when-cross-origin, strict-origin-when-cross-origin",
    "x-frame-options": "DENY, DENY",
    "permissions-policy": (
        "camera=(), microphone=(), geolocation=(), interest-cohort=(), "
        "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    ),
}

MODES = {
    "ok",
    "early-hints",
    "missing-redirect-csp",
    "joined-duplicates",
    "joined-api-duplicates",
}


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "ok"
    if mode not in MODES:
        print(f"unknown mode: {mode}", file=sys.stderr)
        return 2

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt: str, *args) -> None:  # noqa: A003
            return

        def _send(self, code: int, headers: Dict[str, str], body: bytes = b"ok") -> None:
            self.send_response(code)
            for k, v in headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:  # noqa: N802
            path = self.path.split("?", 1)[0]
            page = JOINED_PAGE_HEADERS if mode == "joined-duplicates" else PAGE_HEADERS
            api = JOINED_API_HEADERS if mode == "joined-api-duplicates" else API_HEADERS

            if mode == "early-hints" and path == "/en":
                self.wfile.write(
                    b"HTTP/1.1 103 Early Hints\r\n"
                    b"Link: </app.css>; rel=preload; as=style\r\n\r\n"
                )
                self.wfile.flush()
                self._send(200, page)
                return
            if path.startswith("/en/dashboard"):
                headers = dict(page)
                if mode == "missing-redirect-csp":
                    headers.pop("content-security-policy", None)
                headers["Location"] = "/en/login?next=%2Fen%2Fdashboard"
                self._send(302, headers, b"")
                return
            if path.startswith("/en/login") or path == "/en":
                self._send(200, page)
                return
            if path.startswith("/api/v1/"):
                code = 401 if "portal" in path else 200
                self._send(code, api, b"{}")
                return
            self._send(404, page, b"missing")

    server = HTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address[:2]
    base = f"http://{host}:{port}"
    try:
        env = os.environ.copy()
        env["SECURITY_HEADERS_BASE_URL"] = base
        env["SECURITY_HEADERS_ALLOW_LOCALHOST"] = "1"
        env["SECURITY_HEADERS_MAX_ATTEMPTS"] = "1"
        env["SECURITY_HEADERS_REQUIRE_CONSECUTIVE"] = "1"
        env.pop("BASE_URL", None)
        proc = subprocess.run(
            ["bash", "scripts/smoke/security_headers.sh"],
            cwd=str(ROOT),
            env=env,
            text=True,
            capture_output=True,
            check=False,
        )
        sys.stdout.write(proc.stdout)
        sys.stderr.write(proc.stderr)
        return int(proc.returncode)
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    raise SystemExit(main())
