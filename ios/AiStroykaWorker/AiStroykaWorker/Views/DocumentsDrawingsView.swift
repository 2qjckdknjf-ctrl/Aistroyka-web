//
//  DocumentsDrawingsView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct DocumentsDrawingsView: View {
    let project: ProjectDTO
    @State private var documents: [WorkerDocumentDTO] = []
    @State private var loading = true
    @State private var errorMessage: String?
    @State private var query = ""
    @State private var tab: WorkerDocumentTab = .myTasks
    @State private var opened: WorkerDocumentDTO?

    var body: some View {
        NavigationStack {
            Group {
                if loading && documents.isEmpty {
                    ScrollView { WorkerV43Skeleton(height: 180).padding(WorkerV43.screenX) }
                } else if let errorMessage, documents.isEmpty {
                    WorkerV43EmptyState(title: WorkerV43Copy.userFacing(errorMessage), retry: load)
                } else {
                    content
                }
            }
            .background(WorkerV43.bg.ignoresSafeArea())
            .navigationTitle(NSLocalizedString("wrk_v43_documents", comment: ""))
            .refreshable { load() }
            .onAppear {
                documents = WorkerV43API.cachedDocuments(projectId: project.id)
                load()
            }
            .overlay(alignment: .topLeading) {
                Color.clear
                    .frame(width: 8, height: 8)
                    .accessibilityIdentifier("pilot_worker_documents")
            }
            .overlay(alignment: .topTrailing) {
                Color.clear
                    .frame(width: 8, height: 8)
                    .accessibilityIdentifier("pilot_worker_docs_offline")
                    .accessibilityValue("\(WorkerDocumentPinStore.offlineCount())")
            }
            .background(
                NavigationLink(
                    destination: Group {
                        if let opened {
                            DocumentPreviewView(document: opened)
                        }
                    },
                    isActive: Binding(
                        get: { opened != nil },
                        set: { if !$0 { opened = nil } }
                    )
                ) { EmptyView() }
                .hidden()
            )
        }
    }

    private var filtered: [WorkerDocumentDTO] {
        documents.filter { doc in
            if !query.isEmpty, !doc.title.localizedCaseInsensitiveContains(query) { return false }
            switch tab {
            case .myTasks: return true
            case .drawings: return doc.type.contains("draw") || doc.title.localizedCaseInsensitiveContains("кж")
            case .instructions: return doc.type.contains("instruct") || doc.title.localizedCaseInsensitiveContains("инстр")
            case .acts: return doc.type == "act"
            }
        }
    }

    private var pinnedDrawing: WorkerDocumentDTO? {
        let pinned = documents.filter { WorkerDocumentPinStore.isPinned($0.id) }
        return pinned.first { $0.type.contains("draw") } ?? pinned.first ?? filtered.first { $0.type.contains("draw") }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "magnifyingglass").foregroundStyle(WorkerV43.textSecondary)
                    TextField(NSLocalizedString("wrk_v43_doc_search", comment: ""), text: $query)
                        .foregroundStyle(WorkerV43.textPrimary)
                }
                .padding(12)
                .background(WorkerV43.card)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(WorkerDocumentTab.allCases, id: \.self) { item in
                            WorkerV43Chip(title: tabLabel(item), selected: tab == item) { tab = item }
                        }
                    }
                }
                WorkerV43Card {
                    HStack {
                        Image(systemName: "checkmark.icloud.fill").foregroundStyle(WorkerV43.success)
                        VStack(alignment: .leading) {
                            Text(String(format: NSLocalizedString("wrk_v43_docs_offline_fmt", comment: ""), WorkerDocumentPinStore.offlineCount()))
                                .foregroundStyle(WorkerV43.textPrimary)
                            Text(NSLocalizedString("wrk_v43_available_offline", comment: ""))
                                .font(.caption)
                                .foregroundStyle(WorkerV43.success)
                        }
                        Spacer()
                        Button(NSLocalizedString("wrk_v43_refresh", comment: ""), action: load)
                            .foregroundStyle(WorkerV43.cyan)
                    }
                }
                if let first = pinnedDrawing {
                    WorkerV43Card(borderColor: WorkerV43.yellow.opacity(0.4)) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(NSLocalizedString("wrk_v43_pinned_drawing", comment: ""))
                                .font(.caption)
                                .foregroundStyle(WorkerV43.cyan)
                            Text(first.title)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(WorkerV43.textPrimary)
                            WorkerV43PrimaryButton(title: NSLocalizedString("wrk_v43_open_drawing", comment: ""), systemImage: "book") {
                                opened = first
                            }
                        }
                    }
                }
                ForEach(filtered) { doc in
                    WorkerV43Row(
                        title: doc.title,
                        subtitle: "\(WorkerV43Copy.documentType(doc.type)) · \(WorkerV43Copy.documentOfflineLabel(doc))",
                        systemImage: WorkerDocumentPinStore.isPinned(doc.id) ? "pin.fill" : "doc.fill",
                        trailing: WorkerV43Copy.documentOfflineLabel(doc),
                        action: { opened = doc }
                    )
                }
                if filtered.isEmpty {
                    WorkerV43EmptyState(
                        title: NSLocalizedString("wrk_v43_docs_empty", comment: ""),
                        systemImage: "folder"
                    )
                }
            }
            .padding(WorkerV43.screenX)
        }
    }

    private func tabLabel(_ tab: WorkerDocumentTab) -> String {
        switch tab {
        case .myTasks: return NSLocalizedString("wrk_v43_docs_my_tasks", comment: "")
        case .drawings: return NSLocalizedString("wrk_v43_docs_drawings", comment: "")
        case .instructions: return NSLocalizedString("wrk_v43_docs_instructions", comment: "")
        case .acts: return NSLocalizedString("wrk_v43_docs_acts", comment: "")
        }
    }

    private func load() {
        errorMessage = nil
        if WorkerV43Preview.isEnabled {
            documents = WorkerV43PreviewCatalog.documents(projectId: project.id)
            documents.prefix(1).forEach { WorkerDocumentPinStore.pinLocalFile($0) }
            loading = false
            return
        }
        loading = documents.isEmpty
        Task {
            do {
                let list = try await WorkerV43API.documents(projectId: project.id)
                await MainActor.run {
                    documents = list
                    loading = false
                }
            } catch {
                await MainActor.run {
                    if documents.isEmpty {
                        errorMessage = WorkerV43Copy.userFacing(error)
                    }
                    loading = false
                }
            }
        }
    }
}
