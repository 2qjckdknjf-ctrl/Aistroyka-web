//
//  HomeDashboardView.swift
//  AiStroyka Manager
//

import SwiftUI

struct HomeDashboardView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Dashboard")
                        .font(.title2)
                        .fontWeight(.semibold)
                    Text("KPIs, active projects, delayed tasks, and quick actions will appear here.")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
            }
            .navigationTitle("Home")
            .background(Color(.systemGroupedBackground))
        }
    }
}
