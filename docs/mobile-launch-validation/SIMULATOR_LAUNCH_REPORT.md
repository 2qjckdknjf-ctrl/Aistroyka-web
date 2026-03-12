# Simulator Launch Validation Report — iOS Launch Validation

**Date:** 2026-03-12  
**Role:** Principal iOS Release Engineer + Mobile Stabilization Lead

---

## 1. Build status (prerequisite)

- **AiStroykaWorker:** BUILD SUCCEEDED (Debug, iPhone 15 simulator destination).
- **AiStroykaManager:** BUILD SUCCEEDED (Debug, iPhone 15 simulator destination).

Both apps produce a valid `.app` bundle in DerivedData and are ready to run on simulator.

---

## 2. Simulator launch attempt

**Attempted:** Boot simulator and install/launch both apps via `xcrun simctl`.

**Result:** Simulator **did not boot** in the automation environment:

```
xcrun simctl boot F807605D-F0FA-45DA-961E-B1AC69A27A91
An error was encountered processing the command (domain=NSPOSIXErrorDomain, code=60):
Unable to boot the Simulator.
launchd failed to respond.
Underlying error (domain=com.apple.SimLaunchHostService.RequestError, code=4):
Failed to start launchd_sim: could not bind to session, launchd_sim may have crashed or quit responding
```

This is an **environment/session limitation** (e.g. no graphical session or Simulator service unavailable), not an app defect. Manual launch from Xcode on a machine with a display and Simulator is required to complete launch validation.

---

## 3. Expected behavior when launched (manual validation)

Use this as a checklist when running in Xcode on simulator:

### AiStroykaWorker

- [ ] App starts without immediate crash.
- [ ] Login screen appears (or expected bootstrap route if session restored).
- [ ] Session/bootstrap logic does not hard-crash (missing backend shows error, not crash).
- [ ] Root navigation shell loads after auth if session valid.
- [ ] Shared networking/config (Config, AuthService) do not fail at startup; missing config handled clearly.

### AiStroykaManager

- [ ] App starts without immediate crash.
- [ ] Login screen or unauthorized view appears.
- [ ] Dashboard/home shell loads after successful login (or placeholder/error if no backend).
- [ ] Tabs (e.g. Home, Projects, Tasks, Reports, More) are reachable.
- [ ] Settings / Notifications entry points load without crash.
- [ ] Missing backend config handled clearly (no hard-crash).

---

## 4. Required local config for full flow

- **BASE_URL:** Optional for launch; default `http://localhost:3000`; set for real API.
- **SUPABASE_URL / SUPABASE_ANON_KEY:** Required for sign-in; if unset, login fails with clear error (see CONFIG_AND_ENV_SETUP.md).

---

## 5. Conclusion

- **Automated simulator launch:** Not completed due to Simulator boot failure in this environment.
- **Next step:** Run both apps from Xcode (Product → Run) on an available simulator and verify the items in Section 3. Both apps are **build-ready** and **expected to launch** with the current code and config fallbacks.
