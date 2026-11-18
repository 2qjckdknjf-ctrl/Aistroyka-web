import SwiftUI
import Shared

struct CustomerHomeView: View {
    @EnvironmentObject var sessionState: CustomerSessionState
    @State private var projects: [CustomerAPI.PortalProject] = []
    @State private var loadState: LoadState = .loading
    @State private var loadGeneration = 0

    private enum LoadState {
        case loading
        case loaded
        case empty
        case failed(String)
    }

    var body: some View {
        NavigationStack {
            Group {
                switch loadState {
                case .loading:
                    CustomerStatusView(kind: .loading, message: NSLocalizedString("cust_projects_loading", comment: ""))
                        .accessibilityIdentifier("pilot_customer_projects_loading")
                case .failed(let message):
                    CustomerStatusView(
                        kind: .error,
                        message: message,
                        actionTitle: NSLocalizedString("cust_retry", comment: ""),
                        action: { Task { await loadProjects() } }
                    )
                    .accessibilityIdentifier("pilot_customer_projects_error")
                case .empty:
                    ScrollView {
                        CustomerStatusView(kind: .error, message: NSLocalizedString("cust_home_empty", comment: ""))
                            .frame(maxWidth: .infinity)
                    }
                    .refreshable { await loadProjects() }
                    .accessibilityIdentifier("pilot_customer_home_empty")
                case .loaded:
                    List(projects) { project in
                        NavigationLink(value: project) {
                            CustomerProjectCard(project: project)
                        }
                        .listRowBackground(CustomerTokens.fieldFill)
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .refreshable { await loadProjects() }
                    .accessibilityIdentifier("pilot_customer_projects_list")
                }
            }
            .background(CustomerTokens.canvas.ignoresSafeArea())
            .navigationTitle(NSLocalizedString("cust_home_title", comment: ""))
            .navigationDestination(for: CustomerAPI.PortalProject.self) { project in
                CustomerProjectDetailView(projectId: project.id, fallbackName: project.name)
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    NavigationLink {
                        CustomerIntakeListView(
                            boundProjectId: projects.count == 1 ? projects[0].id : nil,
                            boundProjectName: projects.count == 1 ? projects[0].name : nil
                        )
                    } label: {
                        Text(NSLocalizedString("cust_intake_nav", comment: ""))
                    }
                    .accessibilityIdentifier("pilot_customer_intake_nav")
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(NSLocalizedString("cust_sign_out", comment: "")) {
                        Task { await sessionState.signOut() }
                    }
                    .accessibilityIdentifier("pilot_customer_sign_out")
                }
            }
            .task {
                await loadProjects()
            }
        }
    }

    private func loadProjects() async {
        loadGeneration += 1
        let generation = loadGeneration
        let replaceWithFullPageLoading: Bool
        switch loadState {
        case .loaded, .empty:
            replaceWithFullPageLoading = false
        case .loading, .failed:
            replaceWithFullPageLoading = true
        }
        if replaceWithFullPageLoading {
            loadState = .loading
        }
        do {
            let rows = try await CustomerAPI.portalProjects()
            guard generation == loadGeneration else { return }
            projects = rows
            loadState = rows.isEmpty ? .empty : .loaded
        } catch let apiError as APIError {
            guard generation == loadGeneration else { return }
            loadState = .failed(apiError.message)
        } catch {
            guard generation == loadGeneration else { return }
            loadState = .failed(NSLocalizedString("cust_projects_error", comment: ""))
        }
    }
}

private struct CustomerProjectCard: View {
    let project: CustomerAPI.PortalProject

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(project.name)
                .font(.headline)
                .foregroundStyle(CustomerTokens.textPrimary)
            Text(NSLocalizedString("cust_project_open", comment: ""))
                .font(.caption)
                .foregroundStyle(CustomerTokens.textSecondary)
        }
        .padding(.vertical, 8)
        .accessibilityIdentifier("pilot_customer_project_\(project.id)")
    }
}
