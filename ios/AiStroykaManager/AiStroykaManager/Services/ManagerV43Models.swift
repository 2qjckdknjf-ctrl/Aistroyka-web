//
//  ManagerV43Models.swift
//  AiStroykaManager
//

import Foundation
import Shared
import SwiftUI

enum ManagerTab: Int, Hashable {
    case home = 0
    case projects = 1
    case tasks = 2
    case ai = 3
    case more = 4
}

enum ManagerV43Preview {
    static var isEnabled: Bool {
        ProcessInfo.processInfo.environment["AISTROYKA_MANAGER_V43_PREVIEW"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_MANAGER_V43_PREVIEW")
    }

    /// UITest-only catalog without a live session. Never used in production launches.
    static var showsCatalogWithoutAuth: Bool {
        isEnabled && ManagerUITestLaunchHooks.isEnabled
    }
}

@MainActor
final class ManagerTabRouter: ObservableObject {
    @Published var selectedTab: ManagerTab = .home
    @Published var tasksFocusOverdue = false
    @Published var reportsFocusReview = false
    @Published var pendingRiskId: String?
    @Published var pendingProjectId: String?
    @Published var openNotifications = false
    @Published var tasksBadge = 0
    @Published var notificationsBadge = 0

    func openReportsReview() {
        reportsFocusReview = true
        selectedTab = .more
    }

    func openOverdueTasks() {
        tasksFocusOverdue = true
        selectedTab = .tasks
    }

    func openAIRisk(_ id: String) {
        pendingRiskId = id
        selectedTab = .ai
    }

    func openProject(_ id: String) {
        pendingProjectId = id
        selectedTab = .projects
    }
}

enum ManagerRiskDecision: String, Codable, CaseIterable {
    case accept
    case assign
    case reject

    var labelKey: String {
        switch self {
        case .accept: return "mgr_v43_risk_accept"
        case .assign: return "mgr_v43_risk_assign"
        case .reject: return "mgr_v43_risk_reject"
        }
    }
}

struct ManagerRiskAuditEvent: Codable, Identifiable, Equatable {
    var id: String
    var riskId: String
    var decision: ManagerRiskDecision
    var comment: String
    var actor: String
    var source: String
    var createdAt: Date
}

enum ManagerRiskAuditStore {
    private static let key = "mgr.v43.risk.audit.v1"

    static func all() -> [ManagerRiskAuditEvent] {
        guard let data = UserDefaults.standard.data(forKey: key) else { return [] }
        return (try? JSONDecoder().decode([ManagerRiskAuditEvent].self, from: data)) ?? []
    }

    static func append(_ event: ManagerRiskAuditEvent) {
        var items = all()
        items.insert(event, at: 0)
        if let data = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    static func events(for riskId: String) -> [ManagerRiskAuditEvent] {
        all().filter { $0.riskId == riskId }
    }
}

enum ManagerLiveSync {
    static let reportsChanged = Notification.Name("mgr.live.reports")
    static let tasksChanged = Notification.Name("mgr.live.tasks")
    static let teamChanged = Notification.Name("mgr.live.team")
    static let documentsChanged = Notification.Name("mgr.live.documents")
    static let notificationsChanged = Notification.Name("mgr.live.notifications")
    static let projectsChanged = Notification.Name("mgr.live.projects")
    static let decisionsChanged = Notification.Name("mgr.live.decisions")
    static let workspaceChanged = Notification.Name("mgr.live.workspace")
    static let aiAssistantChanged = Notification.Name("mgr.live.aiAssistant")
    static let appBecameActive = Notification.Name("mgr.live.foreground")

    static func post(_ name: Notification.Name) {
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: name, object: nil)
        }
    }
}

enum ManagerCacheStore {
    static func save<T: Encodable>(_ value: T, key: String) {
        guard let data = try? JSONEncoder().encode(value) else { return }
        UserDefaults.standard.set(data, forKey: key)
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: key + ".syncedAt")
    }

    static func remove(key: String) {
        UserDefaults.standard.removeObject(forKey: key)
        UserDefaults.standard.removeObject(forKey: key + ".syncedAt")
    }

    static func load<T: Decodable>(_ type: T.Type, key: String) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }

    static func lastSync(key: String) -> Date? {
        let raw = UserDefaults.standard.double(forKey: key + ".syncedAt")
        return raw > 0 ? Date(timeIntervalSince1970: raw) : nil
    }
}

struct ManagerAIRiskItem: Identifiable, Hashable {
    var id: String
    var title: String
    var projectName: String
    var severity: String
    var probability: Int
    var delayDays: Int
    var budgetImpact: Double?
    var confidence: Int
    var summary: String
    var recommendation: String
    var jobStatus: String?
}

struct ManagerDocumentItem: Identifiable, Hashable {
    var id: String
    var title: String
    var type: String
    var status: String
    var updatedAt: String?
    var projectId: String
}

struct ProjectEstimateSummaryDTO: Decodable {
    var projectId: String?
    var tenantId: String?
    var budgetSummary: BudgetSummary?
    struct BudgetSummary: Decodable {
        var plannedTotal: Double?
        var actualTotal: Double?
        var varianceAmount: Double?
        var currency: String?
        var overBudget: Bool?
        var itemCount: Int?
    }
}

struct ProjectDocumentDTO: Decodable, Identifiable {
    var id: String
    var projectId: String?
    var type: String?
    var title: String?
    var status: String?
    var updatedAt: String?
    var objectPath: String?
}

struct ProjectDocumentsResponse: Decodable {
    var data: [ProjectDocumentDTO]?
}

struct ProjectEstimateResponse: Decodable {
    var data: ProjectEstimateSummaryDTO?
}

enum ManagerDemoCatalog {
    static let workspaceName = "StroyInvest"
    static let featuredProjectId = "demo-lcd-solnechniy"
    static let featuredProjectName = "LCD Solnechniy"
    static let featuredProgress = 0.78
    static let featuredBudget = 562_400_000.0
    static let featuredPlan = 640_000_000.0
    static let featuredDelayDays = 8

    static var projects: [ProjectDTO] {
        [
            ProjectDTO(id: featuredProjectId, name: featuredProjectName),
            ProjectDTO(id: "demo-tc-severniy", name: "TC Severniy"),
        ]
    }

    static var tasks: [TaskDTO] {
        let iso = ISO8601DateFormatter()
        let today = iso.string(from: Date())
        let yesterday = iso.string(from: Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date())
        return [
            TaskDTO(id: "demo-task-rebar", title: NSLocalizedString("mgr_v43_risk_rebar_title", comment: ""), status: "pending", projectId: featuredProjectId, dueDate: "2000-01-01T00:00:00Z"),
            TaskDTO(id: "demo-task-finish", title: NSLocalizedString("mgr_v43_risk_finish_title", comment: ""), status: "in_progress", projectId: featuredProjectId, dueDate: today),
            TaskDTO(id: "demo-task-review", title: NSLocalizedString("mgr_v43_chip_review", comment: ""), status: "review", projectId: featuredProjectId, dueDate: today),
            TaskDTO(id: "demo-task-yesterday", title: NSLocalizedString("mgr_v43_risk_finish_title", comment: ""), status: "pending", projectId: featuredProjectId, dueDate: yesterday),
        ]
    }

    static var reports: [ReportListItemDTO] {
        [
            ReportListItemDTO(id: "demo-report-1", projectId: featuredProjectId, taskId: "demo-task-rebar", userId: "demo-ivan", status: "submitted", createdAt: ISO8601DateFormatter().string(from: Date()), submittedAt: nil, mediaCount: 8, analysisStatus: "flagged_deviation", actualVolume: 36, plannedVolume: 40),
            ReportListItemDTO(id: "demo-report-2", projectId: featuredProjectId, taskId: nil, userId: nil, status: "submitted", createdAt: ISO8601DateFormatter().string(from: Date()), submittedAt: nil, mediaCount: 5, analysisStatus: "ok", actualVolume: nil, plannedVolume: nil),
            ReportListItemDTO(id: "demo-report-3", projectId: featuredProjectId, taskId: nil, userId: nil, status: "changes_requested", createdAt: ISO8601DateFormatter().string(from: Date()), submittedAt: nil, mediaCount: 3, analysisStatus: "ok", actualVolume: nil, plannedVolume: nil),
            ReportListItemDTO(id: "demo-report-4", projectId: featuredProjectId, taskId: nil, userId: nil, status: "approved", createdAt: ISO8601DateFormatter().string(from: Date()), submittedAt: nil, mediaCount: 6, analysisStatus: "ok", actualVolume: nil, plannedVolume: nil),
        ]
    }

    static var workers: [WorkerRowDTO] {
        [
            WorkerRowDTO(userId: "demo-ivan", lastDayDate: "2026-08-25", lastStartedAt: ISO8601DateFormatter().string(from: Date()), lastEndedAt: nil, lastReportSubmittedAt: nil, anomalies: WorkerAnomalies(openShift: true, overtime: false, noActivity: false)),
            WorkerRowDTO(userId: "demo-maria", lastDayDate: "2026-08-25", lastStartedAt: nil, lastEndedAt: ISO8601DateFormatter().string(from: Date()), lastReportSubmittedAt: nil, anomalies: WorkerAnomalies(openShift: false, overtime: false, noActivity: false)),
        ]
    }

    static var notifications: [NotificationInboxItemDTO] {
        [
            NotificationInboxItemDTO(id: "demo-n1", type: "risk", title: NSLocalizedString("mgr_v43_high_risk", comment: ""), body: NSLocalizedString("mgr_v43_risk_rebar_summary", comment: ""), createdAt: ISO8601DateFormatter().string(from: Date()), readAt: nil, targetType: "project", targetId: featuredProjectId, projectId: featuredProjectId),
            NotificationInboxItemDTO(id: "demo-n2", type: "report", title: NSLocalizedString("mgr_v43_ai_found_deviation", comment: ""), body: NSLocalizedString("mgr_v43_risk_rebar_summary", comment: ""), createdAt: ISO8601DateFormatter().string(from: Date()), readAt: nil, targetType: "report", targetId: "demo-report-1", projectId: featuredProjectId),
        ]
    }

    static var workload: [WorkloadItemDTO] {
        [
            WorkloadItemDTO(
                id: "demo-wl-reports",
                kind: "pending_reports_queue",
                priority: "high",
                title: NSLocalizedString("mgr_v43_reports_review_sub", comment: ""),
                reason: nil,
                projectId: nil,
                projectName: nil,
                linkedEntityType: nil,
                linkedEntityId: nil,
                dueState: "waiting_on_you",
                statusBucket: "review"
            ),
            WorkloadItemDTO(
                id: "demo-wl-overdue",
                kind: "overdue_milestones",
                priority: "urgent",
                title: NSLocalizedString("mgr_v43_overdue_sub", comment: ""),
                reason: featuredProjectName,
                projectId: featuredProjectId,
                projectName: featuredProjectName,
                linkedEntityType: nil,
                linkedEntityId: nil,
                dueState: "overdue",
                statusBucket: "action_needed"
            ),
        ]
    }

    static var documents: [ProjectDocumentDTO] {
        [
            ProjectDocumentDTO(id: "demo-doc-1", projectId: featuredProjectId, type: "document", title: "A-201", status: "current", updatedAt: ISO8601DateFormatter().string(from: Date())),
        ]
    }

    static var overview: OpsOverviewDTO {
        OpsOverviewDTO(
            kpis: .init(
                activeProjects: 2,
                activeWorkersToday: 9,
                reportsToday: 4,
                stuckUploads: 0,
                offlineDevices: 0,
                failedJobs24h: 0,
                tasksAssignedToday: 6,
                tasksCompletedToday: 2,
                tasksOpenToday: 4,
                tasksOverdue: 4
            ),
            queues: .init(
                reportsPendingReview: [
                    QueueItem(id: "demo-report-1", status: "submitted", createdAt: nil),
                    QueueItem(id: "demo-report-2", status: "submitted", createdAt: nil),
                    QueueItem(id: "demo-report-3", status: "submitted", createdAt: nil),
                    QueueItem(id: "demo-report-4", status: "submitted", createdAt: nil),
                ],
                tasksOverdue: nil,
                tasksOpenToday: nil
            )
        )
    }

    static func risks(projectName: String) -> [ManagerAIRiskItem] {
        [
            ManagerAIRiskItem(
                id: "demo-rebar",
                title: NSLocalizedString("mgr_v43_risk_rebar_title", comment: ""),
                projectName: projectName,
                severity: "high",
                probability: 70,
                delayDays: 8,
                budgetImpact: 3_600_000,
                confidence: 86,
                summary: NSLocalizedString("mgr_v43_risk_rebar_summary", comment: ""),
                recommendation: NSLocalizedString("mgr_v43_risk_rebar_reco", comment: ""),
                jobStatus: nil
            ),
            ManagerAIRiskItem(
                id: "demo-budget",
                title: NSLocalizedString("mgr_v43_risk_finish_title", comment: ""),
                projectName: projectName,
                severity: "medium",
                probability: 45,
                delayDays: 0,
                budgetImpact: nil,
                confidence: 72,
                summary: NSLocalizedString("mgr_v43_risk_finish_summary", comment: ""),
                recommendation: NSLocalizedString("mgr_v43_risk_finish_reco", comment: ""),
                jobStatus: nil
            ),
        ]
    }
}
