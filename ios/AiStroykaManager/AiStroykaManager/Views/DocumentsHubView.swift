//
//  DocumentsHubView.swift
//  AiStroykaManager
//

import SwiftUI
import UIKit
import Shared
import UniformTypeIdentifiers

struct DocumentsHubView: View {
    var initialProjectId: String? = nil
    @State private var projects: [ProjectDTO] = []
    @State private var selectedProjectId: String?
    @State private var documents: [ProjectDocumentDTO] = []
    @State private var query = ""
    @State private var typeFilter = "all"
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var isCreating = false
    @State private var showImporter = false
    @State private var pendingTitle = ""
    @State private var pendingFileURL: URL?
    @StateObject private var networkMonitor = NetworkMonitor.shared
    @State private var lastSync: Date?
    @State private var didLoad = false
    @State private var decidingDocumentId: String?

    var body: some View {
        Group {
            if isLoading && !didLoad && documents.isEmpty && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_v43_loading_docs", comment: ""))
                    .accessibilityIdentifier("pilot_manager_documents_loading")
            } else if let err = errorMessage, documents.isEmpty {
                ErrorStateView(message: err, retry: { load() })
            } else if !isLoading && projects.isEmpty && !ManagerV43Preview.isEnabled {
                EmptyStateView(
                    title: NSLocalizedString("mgr_v43_no_docs", comment: ""),
                    subtitle: NSLocalizedString("mgr_load_projects_first", comment: "")
                )
                .accessibilityIdentifier("pilot_manager_documents_hub")
            } else {
                content
            }
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("mgr_v43_documents", comment: ""))
        .fileImporter(isPresented: $showImporter, allowedContentTypes: [.pdf, .image, .data], allowsMultipleSelection: false) { result in
            if case .success(let urls) = result, let url = urls.first {
                pendingTitle = url.lastPathComponent
                pendingFileURL = url
                Task { await createDocument() }
            }
        }
        .onAppear { loadIfNeeded() }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.documentsChanged)) { _ in
            load()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
            load()
        }
        .refreshable { await loadAsync() }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showImporter = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel(NSLocalizedString("mgr_v43_upload", comment: ""))
            }
        }
    }

    private var filtered: [ProjectDocumentDTO] {
        documents.filter { doc in
            let matchesQuery = query.isEmpty || (doc.title ?? "").localizedCaseInsensitiveContains(query)
            let matchesType = typeFilter == "all" || (doc.type ?? "") == typeFilter
            return matchesQuery && matchesType
        }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if !networkMonitor.isConnected {
                    ManagerV43OfflineBanner(lastSync: lastSync, retry: { load() })
                }
                HStack {
                    Image(systemName: "magnifyingglass").foregroundStyle(ManagerV43.textSecondary)
                    TextField(NSLocalizedString("mgr_v43_doc_search", comment: ""), text: $query)
                        .foregroundStyle(ManagerV43.textPrimary)
                }
                .padding(.horizontal, 12)
                .frame(minHeight: ManagerV43.touch)
                .background(ManagerV43.card)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ManagerV43Chip(title: NSLocalizedString("mgr_all", comment: ""), selected: typeFilter == "all") { typeFilter = "all" }
                        ManagerV43Chip(title: NSLocalizedString("mgr_v43_drawings", comment: ""), selected: typeFilter == "document") { typeFilter = "document" }
                        ManagerV43Chip(title: NSLocalizedString("mgr_v43_acts", comment: ""), selected: typeFilter == "act") { typeFilter = "act" }
                        ManagerV43Chip(title: NSLocalizedString("mgr_v43_contracts", comment: ""), selected: typeFilter == "contract") { typeFilter = "contract" }
                    }
                }

                if let project = projects.first(where: { $0.id == selectedProjectId }) ?? projects.first {
                    HStack {
                        ManagerSiteThumb(size: CGSize(width: 36, height: 36), corner: 18)
                        Text(project.name ?? project.id).foregroundStyle(ManagerV43.textPrimary)
                        Spacer()
                        Menu {
                            ForEach(projects, id: \.id) { p in
                                Button(p.name ?? p.id) { selectedProjectId = p.id; load() }
                            }
                        } label: {
                            Image(systemName: "chevron.down").foregroundStyle(ManagerV43.textSecondary)
                        }
                    }
                    .padding(12)
                    .background(ManagerV43.card)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }

                if filtered.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_v43_no_docs", comment: ""),
                        subtitle: NSLocalizedString("mgr_v43_no_docs_sub", comment: ""),
                        actionTitle: NSLocalizedString("mgr_v43_upload", comment: ""),
                        action: { showImporter = true }
                    )
                    .frame(minHeight: 180)
                } else {
                    ForEach(filtered) { doc in
                        VStack(alignment: .leading, spacing: 8) {
                            Button {
                                openDocument(doc)
                            } label: {
                                HStack(spacing: 12) {
                                    Image(systemName: "doc.fill").foregroundStyle(ManagerV43.danger)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(doc.title ?? doc.id)
                                            .font(.system(size: 15, weight: .semibold))
                                            .foregroundStyle(ManagerV43.textPrimary)
                                        Text("\(doc.type ?? "document") · \(doc.status ?? "")")
                                            .font(.caption)
                                            .foregroundStyle(ManagerV43.textSecondary)
                                    }
                                    Spacer()
                                    statusPill(doc.status)
                                    if ManagerAPI.documentFileURL(objectPath: doc.objectPath) != nil {
                                        Image(systemName: "arrow.up.right")
                                            .foregroundStyle(ManagerV43.textSecondary)
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                            .accessibilityHint(NSLocalizedString("mgr_v43_open_document", comment: ""))
                            if (doc.status ?? "").lowercased() == "under_review" {
                                HStack(spacing: 8) {
                                    documentDecisionButton(
                                        doc,
                                        action: "approve",
                                        title: NSLocalizedString("mgr_v43_doc_approve", comment: ""),
                                        color: ManagerV43.success
                                    )
                                    documentDecisionButton(
                                        doc,
                                        action: "reject",
                                        title: NSLocalizedString("mgr_v43_doc_reject", comment: ""),
                                        color: ManagerV43.danger
                                    )
                                    documentDecisionButton(
                                        doc,
                                        action: "request_changes",
                                        title: NSLocalizedString("mgr_v43_doc_request_changes", comment: ""),
                                        color: ManagerV43.warning
                                    )
                                }
                            }
                        }
                        .padding(12)
                        .background(ManagerV43.card)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                }

                if ManagerV43Preview.isEnabled {
                    ManagerV43Card {
                        HStack {
                            Image("DemoBlueprint")
                                .resizable()
                                .scaledToFill()
                                .frame(width: 92, height: 72)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                            VStack(alignment: .leading, spacing: 8) {
                                Text(NSLocalizedString("mgr_v43_current_drawing", comment: ""))
                                    .font(.caption)
                                    .foregroundStyle(ManagerV43.textSecondary)
                                Text(NSLocalizedString("mgr_v43_open_drawing", comment: ""))
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(ManagerV43.yellow)
                            }
                        }
                    }
                }

                ManagerV43PrimaryButton(
                    title: NSLocalizedString("mgr_v43_upload", comment: ""),
                    systemImage: "plus",
                    enabled: !isCreating,
                    loading: isCreating
                ) { showImporter = true }
            }
            .padding(ManagerV43.screenX)
        }
        .accessibilityIdentifier("pilot_manager_documents_hub")
    }

    private func statusPill(_ status: String?) -> some View {
        let s = (status ?? "").lowercased()
        let kind: ManagerV43StatusPill.Kind
        switch s {
        case "approved": kind = .success
        case "under_review": kind = .ai
        case "rejected", "changes_requested": kind = .danger
        default: kind = .warning
        }
        return ManagerV43StatusPill(text: status ?? "—", kind: kind)
    }

    private func load() {
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        if didLoad { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 },
            previewFallback: {
                projects = ManagerDemoCatalog.projects
                selectedProjectId = initialProjectId ?? ManagerDemoCatalog.featuredProjectId
                documents = ManagerDemoCatalog.documents
                lastSync = Date()
            }
        ) {
            projects = try await ManagerAPI.projects()
            if selectedProjectId == nil { selectedProjectId = initialProjectId ?? projects.first?.id }
            if let pid = selectedProjectId {
                documents = try await ManagerAPI.projectDocuments(projectId: pid)
                ManagerCacheStore.save(documents.map(\.id), key: "mgr.cache.docs")
                lastSync = Date()
            }
        }
        didLoad = true
    }

    private func createDocument() async {
        guard let pid = selectedProjectId ?? projects.first?.id else { return }
        let title = pendingTitle.isEmpty ? NSLocalizedString("mgr_v43_new_document", comment: "") : pendingTitle
        let fileURL = pendingFileURL
        isCreating = true
        defer { isCreating = false }
        do {
            let documentId = try await ManagerAPI.createDocument(
                projectId: pid,
                title: title,
                type: "document",
                idempotencyKey: UUID().uuidString
            )
            if let fileURL {
                let accessed = fileURL.startAccessingSecurityScopedResource()
                defer { if accessed { fileURL.stopAccessingSecurityScopedResource() } }
                let data = try Data(contentsOf: fileURL)
                let mime = mimeType(for: fileURL)
                try await ManagerAPI.uploadDocumentFile(
                    projectId: pid,
                    documentId: documentId,
                    fileData: data,
                    fileName: fileURL.lastPathComponent,
                    mimeType: mime,
                    idempotencyKey: UUID().uuidString
                )
            }
            pendingFileURL = nil
            ManagerLiveSync.post(ManagerLiveSync.documentsChanged)
            await loadAsync()
        } catch {
            errorMessage = localizedManagerError(error)
        }
    }

    private func documentDecisionButton(
        _ doc: ProjectDocumentDTO,
        action: String,
        title: String,
        color: Color
    ) -> some View {
        let busy = decidingDocumentId == doc.id
        return Button {
            decide(doc, action: action)
        } label: {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(color)
                .frame(maxWidth: .infinity, minHeight: 36)
                .background(color.opacity(0.14))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(busy || decidingDocumentId != nil)
        .accessibilityIdentifier("pilot_manager_doc_\(action)_\(doc.id)")
    }

    private func decide(_ doc: ProjectDocumentDTO, action: String) {
        guard let projectId = doc.projectId ?? selectedProjectId else { return }
        decidingDocumentId = doc.id
        Task {
            defer { decidingDocumentId = nil }
            do {
                try await ManagerAPI.decideDocument(
                    projectId: projectId,
                    documentId: doc.id,
                    action: action,
                    idempotencyKey: UUID().uuidString
                )
                ManagerLiveSync.post(ManagerLiveSync.documentsChanged)
                await loadAsync()
            } catch {
                errorMessage = localizedManagerError(error)
            }
        }
    }

    private func openDocument(_ doc: ProjectDocumentDTO) {
        if let url = ManagerAPI.documentFileURL(objectPath: doc.objectPath) {
            UIApplication.shared.open(url)
        } else {
            errorMessage = NSLocalizedString("mgr_v43_document_unavailable", comment: "")
        }
    }

    private func mimeType(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "pdf": return "application/pdf"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "heic": return "image/heic"
        case "webp": return "image/webp"
        default: return "application/octet-stream"
        }
    }
}
