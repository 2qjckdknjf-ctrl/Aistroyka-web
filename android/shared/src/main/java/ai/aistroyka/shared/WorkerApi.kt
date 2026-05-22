package ai.aistroyka.shared

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Worker endpoints matching iOS [WorkerAPI] and `/api/v1` routes.
 */
object WorkerApi {
    private val uploadHttp = OkHttpClient.Builder()
        .connectTimeout(45, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(120, TimeUnit.SECONDS)
        .build()

    suspend fun config(): ConfigResponse = ApiClient.request("config")

    suspend fun projects(): List<ProjectDto> {
        val r: ProjectsResponse = ApiClient.request("projects")
        return r.data.orEmpty()
    }

    /** POST /api/v1/devices/register — FCM token; use when wiring push (parity with iOS [WorkerAPI.registerDevice]). */
    suspend fun registerDevice(fcmToken: String) {
        val body = RegisterDeviceBody(
            deviceId = DeviceContext.deviceId,
            platform = "android",
            token = fcmToken.trim(),
        )
        val json = ApiClient.json.encodeToString(RegisterDeviceBody.serializer(), body)
        ApiClient.requestVoid(
            path = "devices/register",
            method = "POST",
            jsonBody = json,
            idempotencyKey = DeviceContext.idempotencyKeyDeviceRegister(fcmToken),
        )
    }

    /** POST /api/v1/devices/unregister — remove device_tokens row before sign-out (parity with iOS). */
    suspend fun unregisterDevice() {
        val body = UnregisterDeviceBody(deviceId = DeviceContext.deviceId)
        val json = ApiClient.json.encodeToString(UnregisterDeviceBody.serializer(), body)
        ApiClient.requestVoid(
            path = "devices/unregister",
            method = "POST",
            jsonBody = json,
            idempotencyKey = DeviceContext.idempotencyKeyDeviceUnregister(),
        )
    }

    suspend fun tasksToday(projectId: String?): List<TaskDto> {
        val q = if (!projectId.isNullOrBlank()) "?project_id=${java.net.URLEncoder.encode(projectId, Charsets.UTF_8.name())}" else ""
        val r: TasksTodayResponse = ApiClient.request("worker/tasks/today$q")
        return r.data.orEmpty()
    }

    suspend fun startDay(idempotencyKey: String): String {
        val r: WorkerDayResponse = ApiClient.request(
            path = "worker/day/start",
            method = "POST",
            jsonBody = "{}",
            idempotencyKey = idempotencyKey,
        )
        return r.data?.id ?: throw ApiError(null, null, "No worker day id in response")
    }

    suspend fun endDay(idempotencyKey: String) {
        ApiClient.requestVoid(
            path = "worker/day/end",
            method = "POST",
            jsonBody = "{}",
            idempotencyKey = idempotencyKey,
        )
    }

    /** GET /api/v1/tasks/:id — detail when assigned to current worker (or manager). Uses [TaskDetailResponse] from ManagerDtos. */
    suspend fun task(taskId: String): TaskDetailDto {
        val r: TaskDetailResponse = ApiClient.request("tasks/${taskId.trim()}")
        return r.data ?: throw ApiError(null, null, "No task in response")
    }

    suspend fun createReport(dayId: String?, taskId: String?, idempotencyKey: String): String {
        val body = ReportCreateBody(dayId = dayId, taskId = taskId)
        val json = ApiClient.json.encodeToString(ReportCreateBody.serializer(), body)
        val r: ReportCreateResponse = ApiClient.request(
            path = "worker/report/create",
            method = "POST",
            jsonBody = json,
            idempotencyKey = idempotencyKey
        )
        val id = r.data?.id ?: throw ApiError(null, null, "No report id in response")
        return id
    }

    suspend fun createUploadSession(purpose: String, idempotencyKey: String): Pair<String, String> {
        val body = CreateUploadSessionBody(purpose = purpose)
        val json = ApiClient.json.encodeToString(CreateUploadSessionBody.serializer(), body)
        val r: UploadSessionResponse = ApiClient.request(
            path = "media/upload-sessions",
            method = "POST",
            jsonBody = json,
            idempotencyKey = idempotencyKey
        )
        val data = r.data ?: throw ApiError(null, null, "No session data")
        val path = data.uploadPath ?: "media/${data.id}"
        return data.id to path
    }

    suspend fun finalizeUploadSession(
        sessionId: String,
        objectPath: String,
        mimeType: String?,
        sizeBytes: Int?,
        idempotencyKey: String,
    ) {
        val body = FinalizeUploadBody(
            objectPath = objectPath,
            mimeType = mimeType,
            sizeBytes = sizeBytes
        )
        val json = ApiClient.json.encodeToString(FinalizeUploadBody.serializer(), body)
        ApiClient.requestVoid(
            path = "media/upload-sessions/$sessionId/finalize",
            method = "POST",
            jsonBody = json,
            idempotencyKey = idempotencyKey
        )
    }

    suspend fun addMedia(reportId: String, uploadSessionId: String, idempotencyKey: String) {
        val body = AddMediaBody(reportId = reportId, uploadSessionId = uploadSessionId)
        val json = ApiClient.json.encodeToString(AddMediaBody.serializer(), body)
        ApiClient.requestVoid(
            path = "worker/report/add-media",
            method = "POST",
            jsonBody = json,
            idempotencyKey = idempotencyKey
        )
    }

    suspend fun submitReport(reportId: String, taskId: String?, idempotencyKey: String, workerNote: String? = null) {
        val json = buildSubmitReportJson(reportId, taskId, workerNote)
        ApiClient.requestVoid(
            path = "worker/report/submit",
            method = "POST",
            jsonBody = json,
            idempotencyKey = idempotencyKey
        )
    }

    /** GET /api/v1/worker/sync — recent reports for signed-in worker (status feed incl. changes_requested/approved). */
    suspend fun workerSync(): List<WorkerSyncReportRow> {
        val env: WorkerSyncEnvelope = ApiClient.request("worker/sync")
        return env.data?.reports.orEmpty()
    }

    /** GET /api/v1/reports/:id — own report detail with manager note and media metadata. */
    suspend fun reportDetail(id: String): WorkerReportDetailData {
        val env: WorkerReportDetailEnvelope = ApiClient.request("reports/${id.trim()}")
        return env.data ?: throw ApiError(null, null, "No report data")
    }

    suspend fun syncBootstrap(): SyncBootstrapResponse {
        return ApiClient.request("sync/bootstrap")
    }

    /**
     * On 409 returns [SyncConflictError] with mustBootstrap/serverCursor.
     */
    suspend fun syncChanges(cursor: Int, limit: Int = 100): SyncChangesResponse {
        val (body, code) = ApiClient.requestDataAndStatus("sync/changes?cursor=$cursor&limit=$limit")
        if (code == 409) {
            val conflict = try {
                ApiClient.json.decodeFromString(SyncConflictBody.serializer(), body)
            } catch (_: Exception) {
                throw ApiError(code, null, body.ifBlank { "Sync conflict" })
            }
            throw SyncConflictError(conflict)
        }
        if (code >= 400) {
            throw ApiError.fromHttp(code, body)
        }
        return ApiClient.json.decodeFromString(SyncChangesResponse.serializer(), body)
    }

    suspend fun syncAck(cursor: Int, idempotencyKey: String) {
        val body = """{"cursor":$cursor}"""
        ApiClient.requestVoid(
            path = "sync/ack",
            method = "POST",
            jsonBody = body,
            idempotencyKey = idempotencyKey
        )
    }

    /**
     * POST binary to Supabase Storage `media` bucket (same as iOS [UploadManager.uploadToSupabaseStorage]).
     * [pathInBucket] is the object key inside the bucket (no `media/` prefix).
     */
    suspend fun uploadToSupabaseStorage(data: ByteArray, pathInBucket: String) = withContext(Dispatchers.IO) {
        val base = AppRuntime.supabaseUrl.trimEnd('/')
        if (base.isBlank()) throw ApiError(null, null, "Supabase URL not configured")
        val token = SessionStore.getAccessToken()
            ?: throw ApiError(null, null, "Not signed in")
        val url = "$base/storage/v1/object/media/$pathInBucket"
        val req = Request.Builder()
            .url(url)
            .post(data.toRequestBody("image/jpeg".toMediaType()))
            .header("Authorization", "Bearer $token")
            .header("apikey", AppRuntime.supabaseAnonKey)
            .header("Content-Type", "image/jpeg")
            .build()
        val res = uploadHttp.newCall(req).execute()
        if (!res.isSuccessful) {
            val msg = if (res.code == 401 || res.code == 403) {
                "Storage policy denied. Check Supabase RLS for bucket media and tenant path."
            } else {
                "Storage upload failed (HTTP ${res.code})"
            }
            throw ApiError(res.code, null, msg)
        }
    }

    @Serializable
    private data class UnregisterDeviceBody(@SerialName("device_id") val deviceId: String)

    @Serializable
    private data class RegisterDeviceBody(
        @SerialName("device_id") val deviceId: String,
        val platform: String,
        val token: String,
    )

    @Serializable
    private data class ReportCreateBody(
        @SerialName("day_id") val dayId: String? = null,
        @SerialName("task_id") val taskId: String? = null,
    )

    @Serializable
    private data class CreateUploadSessionBody(val purpose: String)

    @Serializable
    private data class FinalizeUploadBody(
        @SerialName("object_path") val objectPath: String,
        @SerialName("mime_type") val mimeType: String? = null,
        @SerialName("size_bytes") val sizeBytes: Int? = null,
    )

    @Serializable
    private data class AddMediaBody(
        @SerialName("report_id") val reportId: String,
        @SerialName("upload_session_id") val uploadSessionId: String,
    )

}
