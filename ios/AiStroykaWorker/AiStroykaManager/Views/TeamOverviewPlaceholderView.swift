//
//  TeamOverviewPlaceholderView.swift
//  AiStroyka Manager
//

import SwiftUI

struct TeamOverviewPlaceholderView: View {
    var body: some View {
        NavigationStack {
            List {
                Text("Team — GET /api/v1/workers")
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("Team")
        }
    }
}
