//
//  AICopilotPlaceholderView.swift
//  Legacy name — hosts project picker hint for per-project copilot (see ProjectDetailView).
//

import SwiftUI

struct AICopilotPlaceholderView: View {
    var body: some View {
        EmptyStateView(
            title: NSLocalizedString("mgr_copilot_per_project_title", comment: ""),
            subtitle: NSLocalizedString("mgr_copilot_per_project_body", comment: "")
        )
    }
}
