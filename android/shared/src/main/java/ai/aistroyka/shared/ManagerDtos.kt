package ai.aistroyka.shared

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MeResponse(val data: MeData? = null) {
    @Serializable
    data class MeData(
        @SerialName("tenant_id") val tenantId: String? = null,
        @SerialName("user_id") val userId: String? = null,
        val role: String? = null,
    )
}

@Serializable
data class ReportListItemDto(
    val id: String,
    @SerialName("user_id") val userId: String? = null,
    @SerialName("day_id") val dayId: String? = null,
    val status: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("submitted_at") val submittedAt: String? = null,
    @SerialName("task_id") val taskId: String? = null,
    @SerialName("project_id") val projectId: String? = null,
    @SerialName("media_count") val mediaCount: Int? = null,
    @SerialName("analysis_status") val analysisStatus: String? = null,
)

@Serializable
data class ReportsListResponse(val data: List<ReportListItemDto>? = null)

@Serializable
data class ReportMediaItemDto(
    @SerialName("media_id") val mediaId: String? = null,
    @SerialName("upload_session_id") val uploadSessionId: String? = null,
)

@Serializable
data class ReportDetailDto(
    val id: String? = null,
    @SerialName("tenant_id") val tenantId: String? = null,
    @SerialName("user_id") val userId: String? = null,
    @SerialName("task_id") val taskId: String? = null,
    @SerialName("day_id") val dayId: String? = null,
    val status: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("submitted_at") val submittedAt: String? = null,
    @SerialName("reviewed_at") val reviewedAt: String? = null,
    @SerialName("reviewed_by") val reviewedBy: String? = null,
    @SerialName("manager_note") val managerNote: String? = null,
    val media: List<ReportMediaItemDto>? = null,
)

@Serializable
data class ReportDetailResponse(val data: ReportDetailDto? = null)

@Serializable
data class TaskDetailDto(
    val id: String? = null,
    val title: String? = null,
    val status: String? = null,
    @SerialName("project_id") val projectId: String? = null,
    @SerialName("due_date") val dueDate: String? = null,
    @SerialName("assigned_to") val assignedTo: String? = null,
    @SerialName("report_id") val reportId: String? = null,
    @SerialName("report_status") val reportStatus: String? = null,
)

@Serializable
data class TaskDetailResponse(val data: TaskDetailDto? = null)

/** GET /api/v1/reports/:id/analysis-status — flat JSON (not wrapped in data). */
@Serializable
data class ReportAnalysisStatusDto(
    val status: String,
    @SerialName("reportId") val reportId: String? = null,
    val jobCount: Int? = null,
    val summary: AnalysisJobSummaryDto? = null,
)

@Serializable
data class AnalysisJobSummaryDto(
    val mediaTotal: Int? = null,
    val analyzed: Int? = null,
    val failed: Int? = null,
)

@Serializable
data class ProjectMediaItemDto(
    val id: String,
    @SerialName("file_url") val fileUrl: String,
    val type: String? = null,
    @SerialName("uploaded_at") val uploadedAt: String? = null,
)

@Serializable
data class ProjectMediaListResponse(val data: List<ProjectMediaItemDto>? = null)

@Serializable
data class OpsOverviewDto(
    val kpis: OpsOverviewKpisDto? = null,
    val queues: OpsOverviewQueuesDto? = null,
)

/** Mirrors `getOpsOverview` JSON (mixed camelCase + snake_case in kpis). */
@Serializable
data class OpsOverviewKpisDto(
    val activeProjects: Int? = null,
    val activeWorkersToday: Int? = null,
    val reportsToday: Int? = null,
    val stuckUploads: Int? = null,
    val offlineDevices: Int? = null,
    val failedJobs24h: Int? = null,
    @SerialName("tasks_assigned_today") val tasksAssignedToday: Int? = null,
    @SerialName("tasks_completed_today") val tasksCompletedToday: Int? = null,
    @SerialName("tasks_open_today") val tasksOpenToday: Int? = null,
    @SerialName("tasks_overdue") val tasksOverdue: Int? = null,
)

@Serializable
data class OpsOverviewQueuesDto(
    @SerialName("reportsPendingReview") val reportsPendingReview: List<OpsQueueReportItemDto>? = null,
)

@Serializable
data class OpsQueueReportItemDto(
    val id: String? = null,
    val status: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
)
