//
//  UITestLaunchHooks.swift
//  AiStroykaWorker
//
//  When `AISTROYKA_UI_TEST=1` (set only from UiTest target), normalize cold start for XCTest:
//  complete intro gate and clear auth so LoginView is shown deterministically.
//

import Foundation
import Shared

enum UITestLaunchHooks {
    static var isEnabled: Bool {
        ProcessInfo.processInfo.environment["AISTROYKA_UI_TEST"] == "1"
    }

    /// Live pilot E2E: skip intro; optional `AISTROYKA_E2E_PROJECT_ID` auto-selects project in HomeContainerView.
    static var isE2EEnabled: Bool {
        ProcessInfo.processInfo.environment["AISTROYKA_E2E"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_E2E")
    }

    /// When set with live E2E, opens report compose directly (skips home navigation flake in UITest).
    static var e2eOpenReportDraft: Bool {
        guard isE2EEnabled else { return false }
        return ProcessInfo.processInfo.environment["AISTROYKA_E2E_OPEN_REPORT_DRAFT"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_E2E_OPEN_REPORT_DRAFT")
    }

    /// When set with live E2E, opens resubmit for `e2eReportId` (Phase 5 Manager feedback path).
    static var e2eOpenResubmit: Bool {
        guard isE2EEnabled else { return false }
        return ProcessInfo.processInfo.environment["AISTROYKA_E2E_OPEN_RESUBMIT"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_E2E_OPEN_RESUBMIT")
    }

    /// DEBUG/E2E only: inject synthetic before/after JPEGs through the real compression → queue → upload path.
    static var e2eInjectSyntheticMedia: Bool {
        guard isE2EEnabled else { return false }
        return ProcessInfo.processInfo.environment["AISTROYKA_E2E_INJECT_MEDIA"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_E2E_INJECT_MEDIA")
    }

    /// Pause durable queue on launch (offline/relaunch proof without mutating NWPathMonitor).
    static var e2ePauseQueue: Bool {
        guard isE2EEnabled else { return false }
        return ProcessInfo.processInfo.environment["AISTROYKA_E2E_PAUSE_QUEUE"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_E2E_PAUSE_QUEUE")
    }

    /// Keep durable queue / draft keys across E2E relaunch (Phase 5 offline proof).
    static var e2ePreserveQueue: Bool {
        guard isE2EEnabled else { return false }
        return ProcessInfo.processInfo.environment["AISTROYKA_E2E_PRESERVE_QUEUE"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_E2E_PRESERVE_QUEUE")
    }

    static var e2eProjectId: String? {
        guard isE2EEnabled else { return nil }
        return firstLaunchValue(
            envKeys: ["AISTROYKA_E2E_PROJECT_ID", "IOS_E2E_PROJECT_ID"],
            argFlag: "-AISTROYKA_E2E_PROJECT_ID"
        )
    }

    static var e2eTaskId: String? {
        guard isE2EEnabled else { return nil }
        return firstLaunchValue(
            envKeys: ["AISTROYKA_E2E_TASK_ID", "IOS_E2E_TASK_ID"],
            argFlag: "-AISTROYKA_E2E_TASK_ID"
        )
    }

    static var e2eReportId: String? {
        guard isE2EEnabled else { return nil }
        return firstLaunchValue(
            envKeys: ["AISTROYKA_E2E_REPORT_ID", "IOS_E2E_REPORT_ID"],
            argFlag: "-AISTROYKA_E2E_REPORT_ID"
        )
    }

    static var e2eWorkerNote: String? {
        guard isE2EEnabled else { return nil }
        return firstLaunchValue(
            envKeys: ["AISTROYKA_E2E_WORKER_NOTE", "IOS_E2E_WORKER_NOTE"],
            argFlag: "-AISTROYKA_E2E_WORKER_NOTE"
        )
    }

    private static func firstLaunchValue(envKeys: [String], argFlag: String) -> String? {
        for key in envKeys {
            let env = ProcessInfo.processInfo.environment[key]?
                .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if !env.isEmpty { return env }
        }
        let args = ProcessInfo.processInfo.arguments
        if let idx = args.firstIndex(of: argFlag), idx + 1 < args.count {
            let raw = args[idx + 1].trimmingCharacters(in: .whitespacesAndNewlines)
            if !raw.isEmpty { return raw }
        }
        return nil
    }

    @MainActor
    static func prepareWorkerSurfaceIfNeeded(store: AppStateStoreManager, appState: AppState) async {
        if isE2EEnabled {
            store.save {
                $0.hasCompletedWorkerIntro = true
                if !e2ePreserveQueue {
                    $0.draftReportId = nil
                    $0.pendingUploads = []
                }
            }
            await AuthService.shared.signOut()
            appState.isLoggedIn = false
            appState.currentUser = nil
            return
        }
        guard isEnabled else { return }
        store.save { $0.hasCompletedWorkerIntro = true }
        await AuthService.shared.signOut()
        appState.isLoggedIn = false
        appState.currentUser = nil
    }
}
