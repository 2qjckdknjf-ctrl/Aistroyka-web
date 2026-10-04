//
//  AiFlywheelConfig.swift
//  Shared — flywheel UI gates (default off; opt-in via Info.plist for pilot builds).
//

import Foundation

public enum AiFlywheelConfig {
    /// Optional feedback UI on copilot surfaces. Default false unless Info.plist sets AI_FEEDBACK_CAPTURE_UI_ENABLED = true.
    public static var isFeedbackCaptureUiEnabled: Bool {
        if let env = ProcessInfo.processInfo.environment["AI_FEEDBACK_CAPTURE_UI_ENABLED"]?
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased(),
           env == "true" || env == "1" || env == "yes" {
            return true
        }
        guard let raw = Bundle.main.infoDictionary?["AI_FEEDBACK_CAPTURE_UI_ENABLED"] as? String else {
            return false
        }
        let v = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return v == "true" || v == "1" || v == "yes"
    }
}
