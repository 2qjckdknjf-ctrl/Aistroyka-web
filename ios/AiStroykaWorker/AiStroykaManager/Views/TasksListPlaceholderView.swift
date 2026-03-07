//
//  TasksListPlaceholderView.swift
//  AiStroyka Manager
//

import SwiftUI

struct TasksListPlaceholderView: View {
    var body: some View {
        NavigationStack {
            List {
                Text("Tasks list/board — GET /api/v1/tasks")
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("Tasks")
        }
    }
}
