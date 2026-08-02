#!/usr/bin/env python3
"""Local mocked-host harness for security_headers.sh redirect-hop contracts.

Usage:
  python3 scripts/smoke/security_headers_mock_host.py ok
  python3 scripts/smoke/security_headers_mock_host.py missing-redirect-csp

Exit code mirrors the smoke script (0 only for mode=ok with full PASS).
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
    "permissions-policy": "camera=()",
    "content-security-policy": "default-src 'self'",
    "strict-transport-security": "max-age=31536000",
}

API_HEADERS: Dict[str, str] = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-frame-options": "DENY",
    "permissions-policy": "camera=()",
}


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "ok"
    if mode not in {"ok", "missing-redirect-csp"}:
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
            if path.startswith("/en/dashboard"):
                headers = dict(PAGE_HEADERS)
                if mode == "missing-redirect-csp":
                    headers.pop("content-security-policy", None)
                headers["Location"] = "/en/login?next=%2Fen%2Fdashboard"
                self._send(302, headers, b"")
                return
            if path.startswith("/en/login") or path == "/en":
                self._send(200, PAGE_HEADERS)
                return
            if path.startswith("/api/v1/"):
                code = 401 if "portal" in path else 200
                self._send(code, API_HEADERS, b"{}")
                return
            self._send(404, PAGE_HEADERS, b"missing")

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
