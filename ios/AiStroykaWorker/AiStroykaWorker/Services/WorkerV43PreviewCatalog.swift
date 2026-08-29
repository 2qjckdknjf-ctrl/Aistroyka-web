//
//  WorkerV43PreviewCatalog.swift
//  AiStroykaWorker
//
//  Dev/preview fixtures only. Never used as a production data source.
//

import Foundation
import Shared
import UIKit

enum WorkerV43Copy {
    static func userFacing(_ error: Error) -> String {
        userFacing((error as? APIError)?.message ?? error.localizedDescription)
    }

    static func userFacing(_ raw: String) -> String {
        let lower = raw.lowercased()
        if lower.contains("authentication required")
            || lower.contains("unauthorized")
            || lower.contains("not authenticated")
            || lower.contains("jwt") {
            return NSLocalizedString("wrk_v43_session_expired", comment: "")
        }
        if lower.contains("phone provider")
            || lower.contains("unsupported phone")
            || lower.contains("sms") && (lower.contains("not configured") || lower.contains("disabled") || lower.contains("unavailable"))
            || lower.contains("error sending confirmation otp") {
            return NSLocalizedString("wrk_v43_sms_unavailable", comment: "")
        }
        if lower.contains("network") || lower.contains("offline") || lower.contains("internet") {
            return NSLocalizedString("wrk_v43_network_error", comment: "")
        }
        if lower.contains("forbidden") || lower.contains("insufficient") {
            return NSLocalizedString("wrk_v43_permission_denied", comment: "")
        }
        return raw
    }

    static func analysisStatus(_ status: String?) -> String {
        switch (status ?? "").lowercased() {
        case "success":
            return NSLocalizedString("wrk_v43_ai_done", comment: "")
        case "running":
            return NSLocalizedString("wrk_v43_ai_running", comment: "")
        case "failed":
            return NSLocalizedString("wrk_v43_ai_failed", comment: "")
        case "queued":
            return NSLocalizedString("wrk_v43_ai_queued", comment: "")
        default:
            return NSLocalizedString("wrk_v43_ai_checks", comment: "")
        }
    }

    static func taskStatus(_ status: String) -> String {
        switch status.lowercased() {
        case "in_progress", "in-progress":
            return NSLocalizedString("wrk_v43_in_progress", comment: "")
        case "open", "todo", "assigned":
            return NSLocalizedString("wrk_v43_status_open", comment: "")
        case "in_review", "review":
            return NSLocalizedString("wrk_v43_status_review", comment: "")
        case "overdue":
            return NSLocalizedString("wrk_v43_overdue", comment: "")
        case "done", "completed", "closed":
            return NSLocalizedString("wrk_v43_filter_done", comment: "")
        default:
            return status
        }
    }

    static func taskPriority(_ raw: String?) -> (text: String, kind: WorkerV43StatusPill.Kind) {
        switch (raw ?? "").lowercased() {
        case "high", "urgent", "critical":
            return (NSLocalizedString("worker_priority_high", comment: ""), .danger)
        case "low":
            return (NSLocalizedString("worker_priority_low", comment: ""), .neutral)
        default:
            return (NSLocalizedString("worker_priority_medium", comment: ""), .warning)
        }
    }

    static func documentType(_ type: String) -> String {
        switch type.lowercased() {
        case "drawing", "draw":
            return NSLocalizedString("wrk_v43_doc_type_drawing", comment: "")
        case "instruction", "instruct":
            return NSLocalizedString("wrk_v43_doc_type_instruction", comment: "")
        case "act":
            return NSLocalizedString("wrk_v43_doc_type_act", comment: "")
        default:
            return type
        }
    }

    static func documentStatus(_ status: String) -> String {
        switch status.lowercased() {
        case "downloaded":
            return NSLocalizedString("wrk_v43_doc_status_downloaded", comment: "")
        case "read":
            return NSLocalizedString("wrk_v43_doc_status_read", comment: "")
        case "outdated":
            return NSLocalizedString("wrk_v43_doc_status_outdated", comment: "")
        case "draft":
            return NSLocalizedString("wrk_v43_doc_status_draft", comment: "")
        case "uploaded":
            return NSLocalizedString("wrk_v43_doc_status_uploaded", comment: "")
        case "under_review", "review":
            return NSLocalizedString("wrk_v43_status_review", comment: "")
        case "approved":
            return NSLocalizedString("wrk_v43_doc_status_approved", comment: "")
        case "rejected":
            return NSLocalizedString("wrk_v43_doc_status_rejected", comment: "")
        case "changes_requested":
            return NSLocalizedString("wrk_v43_returned", comment: "")
        case "archived":
            return NSLocalizedString("wrk_v43_doc_status_archived", comment: "")
        default:
            return status
        }
    }

    static func documentOfflineLabel(_ document: WorkerDocumentDTO) -> String {
        if WorkerDocumentPinStore.isOutdated(document) {
            return NSLocalizedString("wrk_v43_doc_status_outdated", comment: "")
        }
        if WorkerDocumentPinStore.cachedFileURL(for: document) != nil {
            return NSLocalizedString("wrk_v43_doc_status_downloaded", comment: "")
        }
        return documentStatus(document.status)
    }

    static func issueStatus(_ status: String) -> String {
        switch status.lowercased() {
        case "open":
            return NSLocalizedString("wrk_v43_status_open", comment: "")
        case "in_review":
            return NSLocalizedString("wrk_v43_status_review", comment: "")
        case "resolved":
            return NSLocalizedString("wrk_v43_status_resolved", comment: "")
        case "closed":
            return NSLocalizedString("wrk_v43_closed", comment: "")
        default:
            return status
        }
    }

    static func reportStatus(_ status: String) -> String {
        switch status.lowercased() {
        case "changes_requested":
            return NSLocalizedString("wrk_v43_returned", comment: "")
        case "submitted":
            return NSLocalizedString("wrk_v43_status_submitted", comment: "")
        default:
            return status
        }
    }
}

enum WorkerV43PreviewCatalog {
    static var projectName: String {
        NSLocalizedString("wrk_v43_preview_project", comment: "")
    }

    static func tasks(projectId: String) -> [TaskDTO] {
        seedProgressIfNeeded()
        return [
            TaskDTO(
                id: "preview-task-1",
                title: NSLocalizedString("wrk_v43_preview_task_main", comment: ""),
                status: "in_progress",
                projectId: projectId,
                dueDate: "09:00–16:00",
                assignedTo: NSLocalizedString("wrk_v43_manager", comment: ""),
                priority: "high"
            ),
            TaskDTO(
                id: "preview-task-2",
                title: NSLocalizedString("wrk_v43_preview_task_next", comment: ""),
                status: "open",
                projectId: projectId,
                dueDate: "14:30",
                assignedTo: nil
            ),
            TaskDTO(
                id: "preview-task-3",
                title: NSLocalizedString("wrk_v43_preview_task_cleanup", comment: ""),
                status: "open",
                projectId: projectId,
                dueDate: "16:00",
                assignedTo: nil
            ),
            TaskDTO(
                id: "preview-task-4",
                title: NSLocalizedString("wrk_v43_preview_task_review", comment: ""),
                status: "in_review",
                projectId: projectId,
                dueDate: nil,
                assignedTo: nil
            ),
            TaskDTO(
                id: "preview-task-5",
                title: NSLocalizedString("wrk_v43_preview_task_overdue", comment: ""),
                status: "overdue",
                projectId: projectId,
                dueDate: nil,
                assignedTo: nil
            ),
        ]
    }

    static func issues(projectId: String) -> [WorkerIssueDTO] {
        [
            WorkerIssueDTO(
                id: "preview-issue-1",
                projectId: projectId,
                title: NSLocalizedString("wrk_v43_preview_issue_fence", comment: ""),
                description: NSLocalizedString("wrk_v43_preview_issue_fence_detail", comment: ""),
                status: "open",
                taskId: "preview-task-5",
                createdAt: nil,
                updatedAt: nil
            ),
            WorkerIssueDTO(
                id: "preview-issue-2",
                projectId: projectId,
                title: NSLocalizedString("wrk_v43_preview_issue_spacers", comment: ""),
                description: nil,
                status: "open",
                taskId: "preview-task-1",
                createdAt: nil,
                updatedAt: nil
            ),
            WorkerIssueDTO(
                id: "preview-issue-3",
                projectId: projectId,
                title: NSLocalizedString("wrk_v43_preview_issue_rebar", comment: ""),
                description: nil,
                status: "open",
                taskId: nil,
                createdAt: nil,
                updatedAt: nil
            ),
            WorkerIssueDTO(
                id: "preview-issue-4",
                projectId: projectId,
                title: NSLocalizedString("wrk_v43_preview_issue_light", comment: ""),
                description: nil,
                status: "in_review",
                taskId: nil,
                createdAt: nil,
                updatedAt: nil
            ),
        ]
    }

    static func documents(projectId: String) -> [WorkerDocumentDTO] {
        let local = ensurePreviewPDF()?.absoluteString
        return [
            WorkerDocumentDTO(
                id: "preview-doc-1",
                projectId: projectId,
                title: NSLocalizedString("wrk_v43_preview_doc_kj", comment: ""),
                type: "drawing",
                status: "downloaded",
                objectPath: nil,
                openUrl: local,
                updatedAt: nil,
                taskId: "preview-task-1"
            ),
            WorkerDocumentDTO(
                id: "preview-doc-2",
                projectId: projectId,
                title: NSLocalizedString("wrk_v43_preview_doc_ppr", comment: ""),
                type: "instruction",
                status: "downloaded",
                objectPath: nil,
                openUrl: local,
                updatedAt: nil,
                taskId: nil
            ),
            WorkerDocumentDTO(
                id: "preview-doc-3",
                projectId: projectId,
                title: NSLocalizedString("wrk_v43_preview_doc_height", comment: ""),
                type: "instruction",
                status: "read",
                objectPath: nil,
                openUrl: local,
                updatedAt: nil,
                taskId: nil
            ),
        ]
    }

    static func ensurePreviewPDF() -> URL? {
        let file = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("wrk-v43-preview-kj07.pdf")
        if FileManager.default.fileExists(atPath: file.path) {
            return file
        }
        let bounds = CGRect(x: 0, y: 0, width: 595, height: 842)
        let renderer = UIGraphicsPDFRenderer(bounds: bounds)
        do {
            try renderer.writePDF(to: file) { context in
                context.beginPage()
                let title = NSLocalizedString("wrk_v43_preview_doc_kj", comment: "") as NSString
                title.draw(
                    at: CGPoint(x: 48, y: 64),
                    withAttributes: [
                        .font: UIFont.systemFont(ofSize: 22, weight: .semibold),
                        .foregroundColor: UIColor.black,
                    ]
                )
            }
            return file
        } catch {
            return nil
        }
    }

    static func reports() -> [WorkerSyncReportRow] {
        [
            WorkerSyncReportRow(
                id: "preview-report-1",
                status: "changes_requested",
                createdAt: ISO8601DateFormatter().string(from: Date()),
                submittedAt: nil
            )
        ]
    }

    static func reportDetail(id: String) -> WorkerReportDetailData {
        WorkerReportDetailData(
            id: id,
            status: "changes_requested",
            managerNote: NSLocalizedString("wrk_v43_preview_manager_note", comment: ""),
            taskId: "preview-task-1",
            workerNote: NSLocalizedString("wrk_v43_preview_worker_note", comment: ""),
            media: [],
            actualVolume: 36,
            plannedVolume: 48
        )
    }

    /// Structured stand-in for a BEFORE frame so the AFTER ghost overlay is visible in catalog.
    static func beforeReferenceImage() -> UIImage {
        let size = CGSize(width: 390, height: 280)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            let rect = CGRect(origin: .zero, size: size)
            UIColor(red: 18 / 255, green: 36 / 255, blue: 58 / 255, alpha: 1).setFill()
            ctx.fill(rect)
            UIColor(red: 48 / 255, green: 78 / 255, blue: 108 / 255, alpha: 1).setFill()
            ctx.fill(CGRect(x: 36, y: 48, width: 140, height: 180))
            UIColor(red: 72 / 255, green: 108 / 255, blue: 138 / 255, alpha: 1).setFill()
            ctx.fill(CGRect(x: 190, y: 72, width: 164, height: 156))
            UIColor(red: 1, green: 196 / 255, blue: 0, alpha: 0.35).setFill()
            ctx.fill(CGRect(x: 0, y: 236, width: 390, height: 44))
        }
    }

    static func seedProgressIfNeeded() {
        var progress = WorkerTaskProgressStore.load(taskId: "preview-task-1")
        if progress.completedStepIndexes.isEmpty {
            progress.completedStepIndexes = [0, 1]
            progress.actualVolume = 36
            progress.crewCount = 6
            WorkerTaskProgressStore.save(progress)
        }
    }
}
