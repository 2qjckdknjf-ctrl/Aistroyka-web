package ai.aistroyka.shared

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Manager endpoints aligned with iOS [ManagerAPI] and `/api/v1` routes.
 * Requires [AppRuntime.apiClientProfile] = `android_manager` (not `android_lite`).
 */
object ManagerApi {

    suspend fun me(): MeResponse = ApiClient.request("me")

    suspend fun projects(): List<ProjectDto> {
        val r: ProjectsResponse = ApiClient.request("projects")
        return r.data.orEmpty()
    }

    suspend fun reports(projectId: String?, status: String?, limit: Int = 80): List<ReportListItemDto> {
        val parts = mutableListOf<String>()
        if (!projectId.isNullOrBlank()) {
            parts.add("project_id=${java.net.URLEncoder.encode(projectId, Charsets.UTF_8.name())}")
        }
        if (!status.isNullOrBlank()) {
            parts.add("status=${java.net.URLEncoder.encode(status, Charsets.UTF_8.name())}")
        }
        parts.add("limit=$limit")
        val q = "?" + parts.joinToString("&")
        val r: ReportsListResponse = ApiClient.request("reports$q")
        return r.data.orEmpty()
    }

    suspend fun opsOverview(limit: Int = 20, projectId: String?): OpsOverviewDto {
        val parts = mutableListOf<String>()
        parts.add("limit=$limit")
        if (!projectId.isNullOrBlank()) {
            parts.add("project_id=${java.net.URLEncoder.encode(projectId, Charsets.UTF_8.name())}")
        }
        val q = "?" + parts.joinToString("&")
        return ApiClient.request("ops/overview$q")
    }

    suspend fun reportDetail(id: String): ReportDetailDto {
        val r: ReportDetailResponse = ApiClient.request("reports/$id")
        return r.data ?: throw ApiError(null, null, "No report data")
    }

    suspend fun reportReview(reportId: String, status: String, managerNote: String?): ReportDetailDto {
        val body = ReportReviewBody(status = status, managerNote = managerNote)
        val json = ApiClient.json.encodeToString(ReportReviewBody.serializer(), body)
        val r: ReportDetailResponse = ApiClient.request(
            path = "reports/$reportId",
            method = "PATCH",
            jsonBody = json,
        )
        return r.data ?: throw ApiError(null, null, "No report data after review")
    }

    suspend fun taskDetail(id: String): TaskDetailDto {
        val r: TaskDetailResponse = ApiClient.request("tasks/$id")
        return r.data ?: throw ApiError(null, null, "No task data")
    }

    suspend fun reportAnalysisStatus(reportId: String): ReportAnalysisStatusDto =
        ApiClient.request("reports/$reportId/analysis-status")

    /** Server caps `limit` (typically 50); pass at most 50 for predictable paging. */
    suspend fun projectMedia(projectId: String, limit: Int = 50): List<ProjectMediaItemDto> {
        val capped = limit.coerceIn(1, 50)
        val r: ProjectMediaListResponse = ApiClient.request("projects/$projectId/media?limit=$capped")
        return r.data.orEmpty()
    }

    @Serializable
    private data class ReportReviewBody(
        val status: String,
        @SerialName("manager_note") val managerNote: String? = null,
    )
}
