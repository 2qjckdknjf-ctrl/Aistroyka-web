package ai.aistroyka.shared

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ConfigResponse(
    val serverTime: String? = null,
    val clientProfile: String? = null,
)

@Serializable
data class ProjectDto(
    val id: String,
    val name: String? = null,
)

@Serializable
data class ProjectsResponse(val data: List<ProjectDto>? = null)

@Serializable
data class TaskDto(
    val id: String,
    val title: String,
    val status: String,
    @SerialName("project_id") val projectId: String? = null,
    @SerialName("due_date") val dueDate: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("assigned_to") val assignedTo: String? = null,
)

@Serializable
data class TasksTodayResponse(val data: List<TaskDto>? = null)

@Serializable
data class ReportCreateResponse(val data: ReportCreateData? = null) {
    @Serializable
    data class ReportCreateData(val id: String)
}

@Serializable
data class UploadSessionResponse(val data: UploadSessionData? = null) {
    @Serializable
    data class UploadSessionData(
        val id: String,
        @SerialName("upload_path") val uploadPath: String? = null,
    )
}

@Serializable
data class WorkerSyncReportRow(
    val id: String,
    val status: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("submitted_at") val submittedAt: String? = null,
)

@Serializable
data class WorkerSyncPayload(
    val reports: List<WorkerSyncReportRow>? = null,
)

@Serializable
data class WorkerSyncEnvelope(
    val data: WorkerSyncPayload? = null,
)

@Serializable
data class WorkerReportMediaItem(
    @SerialName("media_id") val mediaId: String? = null,
    @SerialName("upload_session_id") val uploadSessionId: String? = null,
    @SerialName("file_url") val fileUrl: String? = null,
)

@Serializable
data class WorkerReportDetailData(
    val id: String,
    val status: String,
    @SerialName("manager_note") val managerNote: String? = null,
    @SerialName("task_id") val taskId: String? = null,
    @SerialName("worker_note") val workerNote: String? = null,
    val media: List<WorkerReportMediaItem>? = null,
)

@Serializable
data class WorkerReportDetailEnvelope(
    val data: WorkerReportDetailData? = null,
)

@Serializable
data class SyncConflictBody(
    val code: String? = null,
    @SerialName("must_bootstrap") val mustBootstrap: Boolean? = null,
    @SerialName("server_cursor") val serverCursor: Int? = null,
)

class SyncConflictError(val body: SyncConflictBody) : Exception() {
    val mustBootstrap: Boolean
        get() = body.mustBootstrap == true

    val serverCursor: Int
        get() = body.serverCursor ?: 0
}

@Serializable
data class SyncBootstrapResponse(
    val data: SyncBootstrapData? = null,
    val cursor: Int? = null,
) {
    @Serializable
    data class SyncBootstrapData(
        val tasks: List<SyncTask>? = null,
        val reports: List<SyncReport>? = null,
        @SerialName("uploadSessions") val uploadSessions: List<SyncUploadSession>? = null,
    )

    @Serializable
    data class SyncTask(val id: String? = null)

    @Serializable
    data class SyncReport(val id: String? = null)

    @Serializable
    data class SyncUploadSession(val id: String? = null)
}

@Serializable
data class SyncChangesResponse(
    val data: SyncChangesData? = null,
    @SerialName("next_cursor") val nextCursor: Int? = null,
) {
    @Serializable
    data class SyncChangesData(
        val changes: List<SyncChangeItem>? = null,
    )
}

@Serializable
data class SyncChangeItem(
    val cursor: Int? = null,
    @SerialName("resource_type") val resourceType: String? = null,
    @SerialName("resource_id") val resourceId: String? = null,
    @SerialName("change_type") val changeType: String? = null,
)

