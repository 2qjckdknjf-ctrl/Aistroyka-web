import SwiftUI
import Shared

struct CustomerProjectDetailView: View {
    let projectId: String
    let fallbackName: String
    @State private var view: CustomerAPI.PortalProjectView?
    @State private var message: String?
    @State private var loading = true
    @State private var loadGeneration = 0

    var body: some View {
        Group {
            if loading {
                CustomerStatusView(kind: .loading, message: NSLocalizedString("cust_project_loading", comment: ""))
            } else if let message, view == nil {
                CustomerStatusView(
                    kind: .error,
                    message: message,
                    actionTitle: NSLocalizedString("cust_retry", comment: ""),
                    action: { Task { await load() } }
                )
            } else if let view {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(view.project.name)
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(CustomerTokens.textPrimary)
                        progressBlock(view.progress)
                        if let handover = view.handover {
                            labeled(NSLocalizedString("cust_project_status", comment: ""), value: handover.status)
                        }
                        activitySection(view)
                        documentsSection(view.documents)
                    }
                    .padding(24)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .background(CustomerTokens.canvas.ignoresSafeArea())
                .refreshable { await load() }
                .accessibilityIdentifier("pilot_customer_project_detail")
            }
        }
        .navigationTitle(view?.project.name ?? fallbackName)
        .task { await load() }
    }

    private func progressBlock(_ progress: CustomerAPI.PortalProjectView.Progress) -> some View {
        let total = max(progress.tasksTotal, 0)
        let done = min(max(progress.tasksDone, 0), total)
        let label = total == 0
            ? NSLocalizedString("cust_progress_none", comment: "")
            : String(format: NSLocalizedString("cust_progress_fmt", comment: ""), done, total)
        return VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("cust_progress_title", comment: ""))
                .font(.headline)
                .foregroundStyle(CustomerTokens.textPrimary)
            Text(label)
                .foregroundStyle(CustomerTokens.textSecondary)
        }
    }

    private func activitySection(_ view: CustomerAPI.PortalProjectView) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("cust_activity_title", comment: ""))
                .font(.headline)
                .foregroundStyle(CustomerTokens.textPrimary)
            if view.milestones.isEmpty && view.decisions.isEmpty {
                Text(NSLocalizedString("cust_activity_empty", comment: ""))
                    .foregroundStyle(CustomerTokens.textSecondary)
            }
            ForEach(view.milestones.prefix(5)) { item in
                labeled(item.title, value: item.status)
            }
            ForEach(view.decisions.prefix(5)) { item in
                labeled(item.title, value: item.kind)
            }
        }
    }

    private func documentsSection(_ docs: [CustomerAPI.PortalProjectView.Document]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("cust_documents_title", comment: ""))
                .font(.headline)
                .foregroundStyle(CustomerTokens.textPrimary)
            if docs.isEmpty {
                Text(NSLocalizedString("cust_documents_empty", comment: ""))
                    .foregroundStyle(CustomerTokens.textSecondary)
            }
            ForEach(docs.prefix(8)) { doc in
                labeled(doc.title, value: doc.status)
            }
        }
    }

    private func labeled(_ title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).foregroundStyle(CustomerTokens.textPrimary)
            Text(value).font(.caption).foregroundStyle(CustomerTokens.textSecondary)
        }
    }

    private func load() async {
        loadGeneration += 1
        let generation = loadGeneration
        if view == nil {
            loading = true
            message = nil
        }
        do {
            let next = try await CustomerAPI.portalProject(id: projectId)
            guard generation == loadGeneration else { return }
            view = next
            message = nil
        } catch is CancellationError {
            return
        } catch let urlError as URLError where urlError.code == .cancelled {
            return
        } catch let apiError as APIError {
            guard generation == loadGeneration else { return }
            if view == nil {
                message = apiError.message
            }
        } catch {
            guard generation == loadGeneration else { return }
            if view == nil {
                message = NSLocalizedString("cust_project_error", comment: "")
            }
        }
        if generation == loadGeneration {
            loading = false
        }
    }
}
