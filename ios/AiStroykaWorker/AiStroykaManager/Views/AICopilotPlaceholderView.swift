//
//  AICopilotPlaceholderView.swift
//  AiStroyka Manager
//

import SwiftUI

struct AICopilotPlaceholderView: View {
    var body: some View {
        NavigationStack {
            List {
                Text("AI Copilot — project AI and insights")
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("AI")
        }
    }
}
