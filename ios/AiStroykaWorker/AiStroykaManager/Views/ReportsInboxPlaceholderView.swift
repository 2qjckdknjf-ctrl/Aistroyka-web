//
//  ReportsInboxPlaceholderView.swift
//  AiStroyka Manager
//

import SwiftUI

struct ReportsInboxPlaceholderView: View {
    var body: some View {
        NavigationStack {
            List {
                Text("Reports inbox — GET /api/v1/reports")
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("Reports")
        }
    }
}
