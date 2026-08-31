//
//  ProjectsListView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ProjectsListView: View {
    @EnvironmentObject var router: ManagerTabRouter
    @StateObject private var networkMonitor = NetworkMonitor.shared
    @State private var projects: [ProjectDTO] = []
    @State private var lastSync: Date?
    @State private var query = ""
    @State private var filter: Filter = .all
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showAddProject = false
    @State private var deepLinkProjectId: String?
    @State private var deepLinkProjectName: String?

    enum Filter: String, CaseIterable {
        case all, active, risk, done
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && projects.isEmpty && errorMessage == nil {
                    LoadingStateView(message: NSLocalizedString("mgr_loading_projects", comment: ""))
                        .accessibilityIdentifier("pilot_manager_projects_loading")
                } else if let err = errorMessage, projects.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else if projects.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_projects_yet", comment: ""),
                        subtitle: NSLocalizedString("mgr_v43_create_project_hint", comment: "")
                    )
                    .accessibilityIdentifier("pilot_manager_projects_empty")
                } else {
                    listContent
                }
            }
            .background(ManagerV43.bg.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { await loadAsync() }
            .onAppear {
                if !ManagerV43Preview.isEnabled, filter == .risk || filter == .done {
                    filter = .all
                }
                consumeOpenCreateProject()
                loadIfNeeded()
            }
            .onChange(of: router.openCreateProject) { open in
                if open { consumeOpenCreateProject() }
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.projectsChanged)) { _ in
                load()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
                load()
            }
            .sheet(isPresented: $showAddProject) {
                CreateProjectSheet(
                    onCreated: {
                        showAddProject = false
                        ManagerLiveSync.post(ManagerLiveSync.projectsChanged)
                        load()
                    },
                    onDismiss: { showAddProject = false }
                )
            }
            .onChange(of: router.pendingProjectId) { id in
                guard let id, !id.isEmpty else { return }
                router.pendingProjectId = nil
                deepLinkProjectName = projects.first(where: { $0.id == id })?.name
                deepLinkProjectId = id
            }
            .navigationDestination(isPresented: Binding(
                get: { deepLinkProjectId != nil },
                set: { if !$0 { deepLinkProjectId = nil } }
            )) {
                if let id = deepLinkProjectId {
                    ProjectDetailView(projectId: id, projectName: deepLinkProjectName)
                }
            }
        }
    }

    private func consumeOpenCreateProject() {
        guard router.openCreateProject else { return }
        router.openCreateProject = false
        showAddProject = true
    }

    private var filtered: [ProjectDTO] {
        projects.filter { project in
            let matchesQuery = query.isEmpty || (project.name ?? project.id).localizedCaseInsensitiveContains(query)
            guard matchesQuery else { return false }
            switch filter {
            case .all, .active:
                return true
            case .risk:
                return ManagerV43Preview.isEnabled && project.id == ManagerDemoCatalog.featuredProjectId
            case .done:
                return false
            }
        }
    }

    private var listContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                ManagerScreenHeader(title: NSLocalizedString("mgr_tab_projects", comment: ""), showsBell: true, unread: router.notificationsBadge) {
                    router.openNotificationsInbox()
                }
                if !networkMonitor.isConnected {
                    ManagerV43OfflineBanner(lastSync: lastSync, retry: { load() })
                        .padding(.horizontal, ManagerV43.screenX)
                }
                HStack {
                    Image(systemName: "magnifyingglass").foregroundStyle(ManagerV43.textSecondary)
                    TextField(NSLocalizedString("mgr_v43_find_project", comment: ""), text: $query)
                        .foregroundStyle(ManagerV43.textPrimary)
                }
                .padding(.horizontal, 12)
                .frame(minHeight: ManagerV43.touch)
                .background(ManagerV43.card)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .padding(.horizontal, ManagerV43.screenX)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ManagerV43Chip(title: String(format: NSLocalizedString("mgr_v43_filter_all_fmt", comment: ""), projects.count), selected: filter == .all) { filter = .all }
                        ManagerV43Chip(title: NSLocalizedString("mgr_v43_filter_active", comment: ""), selected: filter == .active) { filter = .active }
                        if ManagerV43Preview.isEnabled {
                            ManagerV43Chip(title: NSLocalizedString("mgr_v43_filter_risk", comment: ""), selected: filter == .risk) { filter = .risk }
                        }
                    }
                    .padding(.horizontal, ManagerV43.screenX)
                }

                ForEach(filtered, id: \.id) { project in
                    NavigationLink(destination: ProjectDetailView(projectId: project.id, projectName: project.name)) {
                        projectCard(project)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, ManagerV43.screenX)
                    .accessibilityIdentifier("pilot_manager_project_\(project.id)")
                }
            }
            .padding(.bottom, 80)
        }
        .overlay(alignment: .bottomTrailing) {
            Button {
                showAddProject = true
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "plus")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(ManagerV43.yellowInk)
                        .frame(width: 56, height: 56)
                        .background(ManagerV43.yellow)
                        .clipShape(Circle())
                    Text(NSLocalizedString("mgr_v43_add_project", comment: ""))
                        .font(.caption2)
                        .foregroundStyle(ManagerV43.textSecondary)
                }
            }
            .buttonStyle(.plain)
            .padding(20)
            .accessibilityLabel(NSLocalizedString("mgr_v43_add_project", comment: ""))
            .accessibilityIdentifier("pilot_manager_add_project")
        }
        .accessibilityIdentifier("pilot_manager_projects_list")
    }

    private func projectCard(_ project: ProjectDTO) -> some View {
        HStack(spacing: 12) {
            ManagerSiteThumb(size: CGSize(width: 72, height: 72), corner: 12)
            VStack(alignment: .leading, spacing: 6) {
                Text(project.name ?? project.id)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .lineLimit(2)
                if ManagerV43Preview.isEnabled {
                    ManagerV43StatusPill(text: NSLocalizedString("mgr_v43_in_progress", comment: ""), kind: .success)
                }
                if ManagerV43Preview.isEnabled {
                    ProgressView(value: ManagerDemoCatalog.featuredProgress)
                        .tint(ManagerV43.dataBlue)
                }
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(ManagerV43.textSecondary)
        }
        .padding(12)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: projects, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 },
            previewFallback: {
                projects = ManagerDemoCatalog.projects
                lastSync = Date()
            }
        ) {
            projects = try await ManagerAPI.projects()
            ManagerCacheStore.save(projects.map(\.id), key: "mgr.cache.projectIds")
            lastSync = Date()
        }
    }
}

struct ProjectDetailPlaceholderView: View {
    let projectId: String
    let name: String

    var body: some View {
        List {
            Text(String(format: NSLocalizedString("mgr_project_fmt", comment: ""), name))
            Text(String(format: NSLocalizedString("mgr_id_fmt", comment: ""), projectId))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .navigationTitle(name)
    }
}

struct CreateProjectSheet: View {
    var onCreated: () -> Void
    var onDismiss: () -> Void
    @State private var name = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                TextField(NSLocalizedString("mgr_v43_project_name", comment: ""), text: $name)
                    .textInputAutocapitalization(.sentences)
                    .padding(12)
                    .frame(minHeight: ManagerV43.touch)
                    .background(ManagerV43.card)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .accessibilityIdentifier("pilot_manager_create_project_name")
                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(ManagerV43.danger)
                }
                ManagerV43PrimaryButton(
                    title: NSLocalizedString("mgr_v43_add_project", comment: ""),
                    enabled: !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSaving,
                    loading: isSaving
                ) {
                    Task { await create() }
                }
                .accessibilityIdentifier("pilot_manager_create_project_submit")
                Spacer()
            }
            .padding(ManagerV43.screenX)
            .background(ManagerV43.bg.ignoresSafeArea())
            .navigationTitle(NSLocalizedString("mgr_v43_add_project_title", comment: ""))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("mgr_cancel", comment: ""), action: onDismiss)
                        .accessibilityIdentifier("pilot_manager_create_project_cancel")
                }
            }
        }
    }

    private func create() async {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (1...200).contains(trimmed.count) else {
            errorMessage = NSLocalizedString("mgr_v43_project_name_invalid", comment: "")
            return
        }
        isSaving = true
        defer { isSaving = false }
        if ManagerV43Preview.isEnabled {
            onCreated()
            return
        }
        do {
            _ = try await ManagerAPI.createProject(name: trimmed, idempotencyKey: UUID().uuidString)
            onCreated()
        } catch {
            errorMessage = (error as? APIError)?.userFacingMessage ?? error.localizedDescription
        }
    }
}
