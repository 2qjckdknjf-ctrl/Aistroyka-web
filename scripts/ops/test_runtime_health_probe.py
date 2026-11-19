"""Exercise the runtime health probe against a local HTTP server."""
import importlib.util
import json
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

spec = importlib.util.spec_from_file_location('probe', Path(__file__).with_name('runtime_health_probe.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

RESPONSES = {}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        status, body = RESPONSES[self.server.server_port]
        payload = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass


class ProbeTests(unittest.TestCase):
    def serve(self, status, body):
        server = HTTPServer(('127.0.0.1', 0), Handler)
        RESPONSES[server.server_port] = (status, body)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        return f'http://127.0.0.1:{server.server_port}'

    def test_healthy_host_passes(self):
        url = self.serve(200, {'ok': True, 'db': 'ok', 'buildStamp': {'sha7': 'abc1234'}})
        result = module.probe(url)
        self.assertTrue(result['healthy'])
        self.assertEqual(result['sha7'], 'abc1234')
        self.assertEqual(module.main(['--base-url', url]), 0)

    def test_database_outage_fails(self):
        url = self.serve(503, {'ok': False, 'db': 'error', 'supabaseReachable': False, 'reason': 'error code: 1016\n', 'buildStamp': {'sha7': 'f6f56b8'}})
        result = module.probe(url)
        self.assertFalse(result['healthy'])
        self.assertEqual(result['status'], 503)
        self.assertEqual(result['details']['db'], 'error')
        self.assertEqual(module.main(['--base-url', url]), 1)

    def test_http_200_with_ok_false_fails(self):
        url = self.serve(200, {'ok': False})
        self.assertFalse(module.probe(url)['healthy'])

    def test_non_json_fails(self):
        url = self.serve(200, b'<html>maintenance</html>')
        result = module.probe(url)
        self.assertFalse(result['healthy'])
        self.assertEqual(result['error'], 'health response is not JSON')

    def test_unreachable_host_fails(self):
        result = module.probe('http://127.0.0.1:9', timeout=2)
        self.assertFalse(result['healthy'])
        self.assertIsNone(result['status'])
        self.assertTrue(result['error'].startswith('request failed'))

    def test_summary_lists_every_target(self):
        ok_url = self.serve(200, {'ok': True, 'buildStamp': {'sha7': 'abc1234'}})
        bad_url = self.serve(503, {'ok': False, 'db': 'error'})
        with tempfile.TemporaryDirectory() as tmp:
            summary = Path(tmp) / 'summary.md'
            self.assertEqual(module.main(['--base-url', ok_url, '--base-url', bad_url, '--summary-file', str(summary)]), 1)
            text = summary.read_text()
        self.assertIn('| yes | abc1234 |', text)
        self.assertIn('| 503 | NO |', text)


    def test_truncated_body_fails_without_raising(self):
        class TruncatingHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                payload = b'{"ok":false,"db":"error"}'
                self.send_response(503)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(payload) + 40))
                self.end_headers()
                self.wfile.write(payload)
                # Close without sending the remaining advertised bytes.

            def log_message(self, *args):
                pass

        server = HTTPServer(('127.0.0.1', 0), TruncatingHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        url = f'http://127.0.0.1:{server.server_port}'
        with tempfile.TemporaryDirectory() as tmp:
            summary = Path(tmp) / 'summary.md'
            code = module.main(['--base-url', url, '--summary-file', str(summary)])
            self.assertEqual(code, 1)
            self.assertTrue(summary.exists())
            self.assertIn('| NO |', summary.read_text())
        result = module.probe(url)
        self.assertFalse(result['healthy'])


if __name__ == '__main__':
    unittest.main()
