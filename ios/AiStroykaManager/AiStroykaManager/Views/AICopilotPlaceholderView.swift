//
//  AICopilotPlaceholderView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct AICopilotPlaceholderView: View {
    var body: some View {
        NavigationStack {
            List {
                Text(NSLocalizedString("mgr_ai_copilot_placeholder", comment: ""))
                    .foregroundStyle(.secondary)
            }
            .navigationTitle(NSLocalizedString("mgr_tab_ai", comment: ""))
        }
    }
}
