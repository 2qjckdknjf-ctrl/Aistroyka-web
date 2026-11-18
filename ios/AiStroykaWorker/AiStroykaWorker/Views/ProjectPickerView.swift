//
//  ProjectPickerView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct ProjectPickerView: View {
    let projects: [ProjectDTO]
    @Binding var selected: ProjectDTO?
    var onScanQR: (() -> Void)? = nil

    var body: some View {
        NavigationStack {
            Group {
                if projects.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "folder")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        Text(NSLocalizedString("worker_no_projects", comment: ""))
                            .font(.headline)
                        Text(NSLocalizedString("worker_picker_empty_subtitle", comment: ""))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
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
                    .aistroykaListChrome(
                        pageBackground: WorkerSemanticColors.pageBackground,
                        surfaceMuted: WorkerSemanticColors.surfaceMuted
                    )
                }
            }
            .aistroykaPageBackground(WorkerSemanticColors.pageBackground)
            .navigationTitle(NSLocalizedString("worker_select_project", comment: ""))
            .toolbar {
                if let onScanQR {
                    ToolbarItem(placement: .primaryAction) {
                        Button(action: onScanQR) {
                            Image(systemName: "qrcode.viewfinder")
                        }
                        .accessibilityLabel(NSLocalizedString("wrk_v43_scan_qr", comment: ""))
                        .accessibilityIdentifier("pilot_worker_picker_scan_qr")
                    }
                }
            }
        }
    }
}
