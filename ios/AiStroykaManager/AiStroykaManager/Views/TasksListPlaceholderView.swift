//
//  TasksListPlaceholderView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct TasksListPlaceholderView: View {
    var body: some View {
        NavigationStack {
            List {
                Text(NSLocalizedString("mgr_tasks_placeholder", comment: ""))
                    .foregroundStyle(BrandTokens.textSecondary)
            }
            .navigationTitle(NSLocalizedString("mgr_tab_tasks", comment: ""))
        .brandScrollChrome()

        }
    }
}
