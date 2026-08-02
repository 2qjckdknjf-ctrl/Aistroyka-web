//
//  ProjectPickerView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct ProjectPickerView: View {
    let projects: [ProjectDTO]
    @Binding var selected: ProjectDTO?

    var body: some View {
        NavigationStack {
            Group {
                if projects.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "folder")
                            .font(.largeTitle)
                            .foregroundStyle(BrandTokens.textSecondary)
                        Text(NSLocalizedString("worker_no_projects", comment: ""))
                            .font(.headline)
                        Text(NSLocalizedString("worker_picker_empty_subtitle", comment: ""))
                            .font(.subheadline)
                            .foregroundStyle(BrandTokens.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()
                } else {
                    List(projects, id: \.id) { p in
                        Button(action: { selected = p }) {
                            HStack {
                                Text(p.name ?? p.id)
                                Spacer()
                                if selected?.id == p.id { Image(systemName: "checkmark") }
                            }
                        }
                        .accessibilityIdentifier("pilot_worker_project_\(p.id)")
                    }
                }
            }
            .navigationTitle(NSLocalizedString("worker_select_project", comment: ""))
        }
    }
}
