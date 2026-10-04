"""Exercise safety decisions with real temporary Git repositories."""
import importlib.util
import json
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

spec = importlib.util.spec_from_file_location('preflight', Path(__file__).with_name('workspace_preflight.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PreflightTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.git('init', '-b', 'main')
        self.git('config', 'user.name', 'Test')
        self.git('config', 'user.email', 'test@example.com')
        self.git('remote', 'add', 'origin', 'https://github.com/2qjckdknjf-ctrl/Aistroyka-web.git')
        (self.root / 'file.txt').write_text('first\n')
        self.git('add', 'file.txt')
        self.git('commit', '-m', 'first')
        self.first = self.git('rev-parse', 'HEAD')
        self.git('update-ref', 'refs/remotes/origin/main', self.first)

    def tearDown(self):
        self.temp.cleanup()

    def git(self, *args):
        return subprocess.run(['git', '-C', str(self.root), *args], capture_output=True, text=True, check=True).stdout.strip()

    def test_fresh_branch_is_usable(self):
        self.git('switch', '-c', 'docs/example')
        self.assertEqual(module.inspect(self.root)['verdict'], 'CURRENT_BASELINE')

    def test_stale_checkout_cannot_start_new_work(self):
        (self.root / 'file.txt').write_text('second\n')
        self.git('commit', '-am', 'second')
        self.git('update-ref', 'refs/remotes/origin/main', self.git('rev-parse', 'HEAD'))
        self.git('switch', '--detach', self.first)
        result = module.inspect(self.root)
        self.assertEqual(result['behind_main'], 1)
        self.assertEqual(result['verdict'], 'RECONCILE_FIRST')

    def test_new_untracked_work_is_preserved(self):
        (self.root / 'valuable.txt').write_text('unfinished work\n')
        self.assertEqual(module.inspect(self.root)['verdict'], 'RECONCILE_FIRST')
        self.assertTrue((self.root / 'valuable.txt').exists())

    def test_missing_remote_baseline_does_not_pass(self):
        self.git('update-ref', '-d', 'refs/remotes/origin/main')
        with self.assertRaises(RuntimeError):
            module.inspect(self.root)

    def test_unrelated_repository_cannot_pass_as_aistroyka(self):
        self.git('remote', 'set-url', 'origin', 'https://github.com/example/unrelated.git')
        self.assertEqual(module.inspect(self.root)['verdict'], 'RECONCILE_FIRST')

    def commit_task_work(self):
        self.git('switch', '-c', 'docs/existing-task')
        (self.root / 'file.txt').write_text('committed task work\n')
        self.git('commit', '-am', 'task work')
        return self.git('rev-parse', 'HEAD')

    def inspect_with_pr(self, state, head):
        original_run = subprocess.run

        def run(args, **kwargs):
            if args[0] == 'gh':
                return subprocess.CompletedProcess(args, 0, stdout=json.dumps({'state': state, 'headRefOid': head}), stderr='')
            return original_run(args, **kwargs)

        with patch.object(module.subprocess, 'run', side_effect=run):
            return module.inspect(self.root, resume_pr=42)

    def test_committed_task_cannot_start_another_task(self):
        self.commit_task_work()
        result = module.inspect(self.root)
        self.assertEqual(result['ahead_main'], 1)
        self.assertEqual(result['verdict'], 'RECONCILE_FIRST')

    def test_current_open_pr_can_resume_committed_task(self):
        head = self.commit_task_work()
        self.assertEqual(self.inspect_with_pr('OPEN', head)['verdict'], 'CURRENT_BASELINE')

    def test_closed_pr_cannot_resume_as_new_work(self):
        head = self.commit_task_work()
        self.assertEqual(self.inspect_with_pr('CLOSED', head)['verdict'], 'RECONCILE_FIRST')

    def test_old_local_head_cannot_resume_current_pr(self):
        self.commit_task_work()
        self.assertEqual(self.inspect_with_pr('OPEN', self.first)['verdict'], 'RECONCILE_FIRST')


if __name__ == '__main__':
    unittest.main()
