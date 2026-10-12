# Native Manager publication — 2026-10-12

The existing report review screen now lets a manager explicitly publish or withdraw one selected photo. It reuses the report publication API; the server derives source identity and preserves the original worker author. Report approval does not publish photos automatically. CAS conflicts reload current state and permissions errors clear the controls.

Seven Shared contract tests and the Manager Debug simulator build PASS. The live simulator test passed 1/1 in 16.475 seconds; independent HTTP readback verified `published=false` and one source row after withdrawal. Private runner credentials were scrubbed. See [validation](validation.json) and [server readback](server-readback.json).

Three-app UI smoke 38188654469 passed on HEAD `0ac23a1e` after the first runner timed out launching Worker. The final candidate incorporates main through #438 and waits for simulator boot completion before launching tests; fresh CI 38190538632 and three-app smoke 38190538635 SUCCESS, non-author exact-head APPROVED; protected merge #435 completed as 7fc8fa2d588f159fe19b7fd2d4baa2b2add7c422. Source hashes in validation.json identify the native code tested by the live scenario.

#437 separately restored original byte delivery: 13 real staging checks on `fac7a17` PASS, including PNG, Proof Pack, private PDF and revocation. All synthetic fixture data and sessions were removed. Physical iPhone remains Offline in Xcode; physical gallery/manual keyboard/OAuth/push/offline/store certification is open. Full Worker capture/upload/submit-to-publication and async AI result evidence remain separate plan work.
