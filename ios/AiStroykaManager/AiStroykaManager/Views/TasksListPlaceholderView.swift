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
                    .foregroundStyle(.secondary)
            }
            .aistroykaListChrome(
                pageBackground: ManagerSemanticColors.pageBackground,
                surfaceMuted: ManagerSemanticColors.surfaceMuted
            )
            .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
            .navigationTitle(NSLocalizedString("mgr_tab_tasks", comment: ""))
        }
    }
}
