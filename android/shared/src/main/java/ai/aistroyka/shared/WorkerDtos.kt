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

