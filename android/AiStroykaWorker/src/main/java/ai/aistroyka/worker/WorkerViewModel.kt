package ai.aistroyka.worker

import android.app.Application
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import ai.aistroyka.shared.ApiError
import ai.aistroyka.shared.AuthService
import ai.aistroyka.shared.DeviceContext
import ai.aistroyka.shared.ProjectDto
import ai.aistroyka.shared.PushRegistrationService
import ai.aistroyka.shared.WorkerReportDetailData
import ai.aistroyka.shared.WorkerSyncReportRow
import ai.aistroyka.shared.SessionStore
import ai.aistroyka.shared.SyncConflictError
import ai.aistroyka.shared.TaskDto
import ai.aistroyka.shared.WorkerApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.time.LocalDate
import java.time.format.DateTimeFormatter

data class WorkerUiState(
    val email: String = "",
    val password: String = "",
    /** login | home | report | resubmit */
    val screen: String = "login",
    val busy: Boolean = false,
    val banner: String? = null,
    val configHint: String? = null,
    val projects: List<ProjectDto> = emptyList(),
    val selectedProjectId: String? = null,
    val tasks: List<TaskDto> = emptyList(),
    val selectedTaskId: String? = null,
    val feedbackReports: List<WorkerSyncReportRow> = emptyList(),
    val selectedFeedbackReportId: String? = null,
    val selectedFeedbackDetail: WorkerReportDetailData? = null,
    val syncStatus: String = "idle",
    val syncCursor: Int = 0,
    val syncError: String? = null,
    /** Local shift id (yyyyMMdd), same contract as iOS `todayDayId`. */
    val shiftDayId: String? = null,
    val activeReportId: String? = null,
    val photoLabel: String? = null,
    val pipelineStatus: String? = null,
    val beforePhotoAttached: Boolean = false,
    val afterPhotoAttached: Boolean = false,
    val workerNote: String = "",
    val submitMessage: String? = null,
    val doneMessage: String? = null,
)

class WorkerViewModel(application: Application) : AndroidViewModel(application) {

    private val shiftPrefs = application.getSharedPreferences("aistroyka_worker_shift", Application.MODE_PRIVATE)
    private val syncPrefs = application.getSharedPreferences("aistroyka_worker_sync", Application.MODE_PRIVATE)

    private val _state = MutableStateFlow(
        WorkerUiState(
            shiftDayId = shiftPrefs.getString("shift_day_id", null)?.takeIf { it.isNotBlank() },
            syncCursor = syncPrefs.getInt("cursor", 0),
        ),
    )
    val state: StateFlow<WorkerUiState> = _state.asStateFlow()

    init {
        if (SessionStore.hasSession()) {
            _state.update { it.copy(screen = "home", banner = null) }
            refreshBootstrap()
            PushRegistrationService.registerIfNeeded()
        }
    }

    fun setEmail(v: String) = _state.update { it.copy(email = v) }
    fun setPassword(v: String) = _state.update { it.copy(password = v) }
    fun setWorkerNote(v: String) = _state.update { it.copy(workerNote = v) }

    fun login() {
        val email = _state.value.email.trim()
        val password = _state.value.password
        if (email.isEmpty() || password.isEmpty()) {
            _state.update { it.copy(banner = "Enter email and password") }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(busy = true, banner = null) }
            try {
                AuthService.signIn(email, password)
                _state.update { it.copy(screen = "home", busy = false) }
                refreshBootstrap()
                PushRegistrationService.registerIfNeeded()
            } catch (e: ApiError) {
                handleApiError(e)
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, banner = e.message ?: "Sign-in failed") }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                if (SessionStore.hasSession()) {
                    try {
                        WorkerApi.unregisterDevice()
                    } catch (_: Exception) {
                    }
                }
            } finally {
                AuthService.signOut()
                shiftPrefs.edit().remove("shift_day_id").apply()
                _state.value = WorkerUiState()
            }
        }
    }

    fun refreshBootstrap() {
        viewModelScope.launch {
            _state.update { it.copy(busy = true, banner = null, configHint = null) }
            try {
                val cfg = WorkerApi.config()
                val projects = WorkerApi.projects()
                val hint = listOfNotNull(
                    cfg.serverTime?.let { t -> "Server time: $t" },
                    cfg.clientProfile?.let { p -> "Profile: $p" },
                ).joinToString(" · ").ifEmpty { null }
                val firstProject = projects.firstOrNull()?.id
                _state.update {
                    it.copy(
                        busy = false,
                        configHint = hint,
                        projects = projects,
                        selectedProjectId = it.selectedProjectId ?: firstProject,
                    )
                }
                loadTasksForSelection()
                refreshFeedbackReports()
                runSync()
            } catch (e: ApiError) {
                handleApiError(e)
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, banner = e.message ?: "Bootstrap failed") }
            }
        }
    }

    fun selectProject(id: String?) {
        _state.update { it.copy(selectedProjectId = id, selectedTaskId = null, tasks = emptyList()) }
        loadTasksForSelection()
    }

    fun selectTask(id: String?) {
        _state.update { it.copy(selectedTaskId = id) }
    }

    fun refreshFeedbackReports() {
        viewModelScope.launch {
            try {
                val reports = WorkerApi.workerSync()
                _state.update {
                    it.copy(
                        feedbackReports = reports,
                    )
                }
            } catch (_: Exception) {
                _state.update { it.copy(feedbackReports = emptyList()) }
            }
        }
    }

    fun runSync() {
        viewModelScope.launch {
            var cursor = _state.value.syncCursor
            var needsBootstrap = (cursor == 0)
            _state.update { it.copy(syncStatus = "syncing", syncError = null) }

            while (true) {
                try {
                    if (needsBootstrap) {
                        val bootstrap = WorkerApi.syncBootstrap()
                        cursor = bootstrap.cursor ?: 0
                        saveCursor(cursor)
                        needsBootstrap = false
                    }

                    val changes = WorkerApi.syncChanges(cursor = cursor, limit = 100)
                    val nextCursor = changes.nextCursor ?: cursor
                    WorkerApi.syncAck(
                        cursor = nextCursor,
                        idempotencyKey = "sync-ack-${DeviceContext.deviceId}-$nextCursor"
                    )
                    saveCursor(nextCursor)
                    cursor = nextCursor

                    if (changes.data?.changes.isNullOrEmpty()) {
                        _state.update { it.copy(syncStatus = "synced", syncCursor = cursor, syncError = null) }
                        refreshFeedbackReports()
                        break
                    }
                } catch (e: SyncConflictError) {
                    if (e.mustBootstrap) {
                        cursor = e.serverCursor
                        saveCursor(cursor)
                        needsBootstrap = true
                        continue
                    }
                    _state.update {
                        it.copy(
                            syncStatus = "needs_bootstrap",
                            syncError = "Sync conflict (cursor ${e.serverCursor})",
                            syncCursor = cursor,
                        )
                    }
                    break
                } catch (e: ApiError) {
                    if (e.isUnauthorized) {
                        handleApiError(e)
                    } else {
                        _state.update {
                            it.copy(
                                syncStatus = "error",
                                syncError = e.message,
                                syncCursor = cursor,
                            )
                        }
                    }
                    break
                } catch (e: Exception) {
                    val offline = (e.message ?: "").contains("Unable to resolve host", ignoreCase = true)
                    _state.update {
                        it.copy(
                            syncStatus = if (offline) "offline" else "error",
                            syncError = e.message ?: if (offline) "Offline" else "Sync failed",
                            syncCursor = cursor,
                        )
                    }
                    break
                }
            }
        }
    }

    fun openResubmit(reportId: String) {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    busy = true,
                    banner = null,
                    screen = "resubmit",
                    selectedFeedbackReportId = reportId,
                    selectedFeedbackDetail = null,
                    submitMessage = null,
                    doneMessage = null,
                )
            }
            try {
                val detail = WorkerApi.reportDetail(reportId)
                _state.update {
                    it.copy(
                        busy = false,
                        selectedFeedbackDetail = detail,
                        pipelineStatus = null,
                        workerNote = detail.workerNote.orEmpty(),
                    )
                }
            } catch (e: ApiError) {
                handleApiError(e)
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, banner = e.message ?: "Could not open report", screen = "home") }
            }
        }
    }

    fun startShift() {
        val day = todayDayId()
        viewModelScope.launch {
            _state.update { it.copy(busy = true, banner = null) }
            try {
                WorkerApi.startDay(idempotencyKey = DeviceContext.newIdempotencyKey())
                shiftPrefs.edit().putString("shift_day_id", day).apply()
                _state.update { it.copy(busy = false, shiftDayId = day) }
                loadTasksForSelection()
            } catch (e: ApiError) {
                handleApiError(e)
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, banner = e.message ?: "Could not start shift") }
            }
        }
    }

    fun endShift() {
        viewModelScope.launch {
            _state.update { it.copy(busy = true, banner = null) }
            try {
                WorkerApi.endDay(idempotencyKey = DeviceContext.newIdempotencyKey())
            } catch (_: Exception) {
            } finally {
                shiftPrefs.edit().remove("shift_day_id").apply()
                _state.update { it.copy(busy = false, shiftDayId = null) }
            }
        }
    }

    private fun loadTasksForSelection() {
        val projectId = _state.value.selectedProjectId
        viewModelScope.launch {
            try {
                val tasks = WorkerApi.tasksToday(projectId)
                _state.update { it.copy(tasks = tasks) }
            } catch (_: Exception) {
                _state.update { it.copy(tasks = emptyList()) }
            }
        }
    }

    fun startNewReport() {
        val dayId = _state.value.shiftDayId
        if (dayId.isNullOrBlank()) {
            _state.update { it.copy(banner = "Start your shift before creating a report.") }
            return
        }
        val taskId = _state.value.selectedTaskId?.trim()?.takeIf { it.isNotEmpty() }
        viewModelScope.launch {
            _state.update {
                it.copy(
                    busy = true,
                    banner = null,
                    activeReportId = null,
                    selectedFeedbackReportId = null,
                    selectedFeedbackDetail = null,
                    photoLabel = null,
                    pipelineStatus = null,
                    beforePhotoAttached = false,
                    afterPhotoAttached = false,
                    workerNote = "",
                    submitMessage = null,
                    doneMessage = null,
                )
            }
            try {
                val id = WorkerApi.createReport(
                    dayId = dayId,
                    taskId = taskId,
                    idempotencyKey = DeviceContext.newIdempotencyKey(),
                )
                _state.update {
                    it.copy(
                        busy = false,
                        screen = "report",
                        activeReportId = id,
                        pipelineStatus = "Add before and after photos, then submit.",
                    )
                }
            } catch (e: ApiError) {
                handleApiError(e)
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, banner = e.message ?: "Create report failed") }
            }
        }
    }

    fun backToHome() {
        _state.update {
            it.copy(
                screen = "home",
                activeReportId = null,
                selectedFeedbackReportId = null,
                selectedFeedbackDetail = null,
                photoLabel = null,
                pipelineStatus = null,
                beforePhotoAttached = false,
                afterPhotoAttached = false,
                workerNote = "",
                submitMessage = null,
                doneMessage = null,
            )
        }
    }

    fun onPhotoPicked(uri: Uri?) {
        if (uri == null) {
            _state.update { it.copy(photoLabel = null, banner = "No image selected") }
            return
        }
        _state.update { it.copy(photoLabel = uri.toString(), banner = null) }
        runUploadPipeline(uri)
    }

    private fun runUploadPipeline(uri: Uri) {
        val reportId = _state.value.activeReportId
        if (reportId == null) {
            _state.update { it.copy(banner = "No active report") }
            return
        }
        val purpose = when {
            !_state.value.beforePhotoAttached -> "report_before"
            !_state.value.afterPhotoAttached -> "report_after"
            else -> {
                _state.update { it.copy(banner = "Before and after photos are already attached.") }
                return
            }
        }
        viewModelScope.launch {
            _state.update { it.copy(busy = true, pipelineStatus = "Preparing…", submitMessage = null) }
            try {
                val jpeg = compressJpeg(uri)
                val suffix = if (purpose == "report_before") "before" else "after"
                val filename = "${reportId.take(8)}-$suffix.jpg"
                _state.update { it.copy(pipelineStatus = "Creating upload session…") }
                val keyCreate = DeviceContext.newIdempotencyKey()
                val (sessionId, uploadPath) = WorkerApi.createUploadSession(
                    purpose = purpose,
                    idempotencyKey = keyCreate,
                )
                val pathInBucket = if (uploadPath.startsWith("media/")) uploadPath.removePrefix("media/") else uploadPath
                val storagePath = "$pathInBucket/$filename"
                val objectPath = "media/$storagePath"
                _state.update { it.copy(pipelineStatus = "Uploading to storage…") }
                WorkerApi.uploadToSupabaseStorage(jpeg, storagePath)
                _state.update { it.copy(pipelineStatus = "Finalizing session…") }
                WorkerApi.finalizeUploadSession(
                    sessionId = sessionId,
                    objectPath = objectPath,
                    mimeType = "image/jpeg",
                    sizeBytes = jpeg.size,
                    idempotencyKey = DeviceContext.newIdempotencyKey(),
                )
                _state.update { it.copy(pipelineStatus = "Linking media to report…") }
                WorkerApi.addMedia(
                    reportId = reportId,
                    uploadSessionId = sessionId,
                    idempotencyKey = DeviceContext.newIdempotencyKey(),
                )
                _state.update {
                    val nowBefore = it.beforePhotoAttached || purpose == "report_before"
                    val nowAfter = it.afterPhotoAttached || purpose == "report_after"
                    it.copy(
                        busy = false,
                        pipelineStatus = "Saved ($suffix).",
                        beforePhotoAttached = nowBefore,
                        afterPhotoAttached = nowAfter,
                    )
                }
            } catch (e: ApiError) {
                handleApiError(e)
                _state.update { it.copy(pipelineStatus = "Failed") }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        busy = false,
                        pipelineStatus = "Failed",
                        banner = e.message ?: "Upload failed",
                    )
                }
            }
        }
    }

    private fun compressJpeg(uri: Uri): ByteArray {
        val ctx = getApplication<Application>().contentResolver
        val bmp = ctx.openInputStream(uri).use { stream ->
            BitmapFactory.decodeStream(stream)
        } ?: throw IllegalStateException("Could not decode image")
        val scaled = scaleDown(bmp, 2048)
        val out = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, 85, out)
        return out.toByteArray()
    }

    private fun scaleDown(source: Bitmap, maxSide: Int): Bitmap {
        val w = source.width
        val h = source.height
        val max = maxOf(w, h)
        if (max <= maxSide) return source
        val scale = maxSide.toFloat() / max
        val nw = (w * scale).toInt().coerceAtLeast(1)
        val nh = (h * scale).toInt().coerceAtLeast(1)
        return Bitmap.createScaledBitmap(source, nw, nh, true)
    }

    fun submitReport() {
        val isResubmit = _state.value.screen == "resubmit"
        val reportId = (_state.value.activeReportId ?: _state.value.selectedFeedbackReportId) ?: run {
            _state.update { it.copy(submitMessage = "No report id") }
            return
        }
        val hasExistingEvidence = _state.value.selectedFeedbackDetail?.media?.isNotEmpty() == true
        val proofOk = if (isResubmit) {
            hasExistingEvidence
        } else {
            BuildConfig.PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO ||
                (_state.value.beforePhotoAttached && _state.value.afterPhotoAttached)
        }
        if (!proofOk) {
            _state.update {
                it.copy(
                    submitMessage = if (isResubmit) {
                        "No existing evidence found for this report."
                    } else {
                        "Attach both before and after photos (or enable pilot flag)."
                    }
                )
            }
            return
        }
        val taskId = if (isResubmit) {
            _state.value.selectedFeedbackDetail?.taskId?.trim()?.takeIf { it.isNotEmpty() }
        } else {
            _state.value.selectedTaskId?.trim()?.takeIf { it.isNotEmpty() }
        }
        val note = _state.value.workerNote.trim().takeIf { it.isNotEmpty() }
        viewModelScope.launch {
            _state.update { it.copy(busy = true, submitMessage = null) }
            try {
                WorkerApi.submitReport(
                    reportId = reportId,
                    taskId = taskId,
                    idempotencyKey = DeviceContext.newIdempotencyKey(),
                    workerNote = note,
                )
                _state.update {
                    it.copy(
                        busy = false,
                        doneMessage = if (isResubmit) {
                            "Report resubmitted successfully."
                        } else {
                            "Report submitted successfully."
                        },
                        submitMessage = null,
                    )
                }
                runSync()
                refreshFeedbackReports()
            } catch (e: ApiError) {
                if (e.isUnauthorized) {
                    handleApiError(e)
                } else {
                    _state.update { it.copy(busy = false, submitMessage = e.message) }
                }
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, submitMessage = e.message ?: "Submit failed") }
            }
        }
    }

    fun dismissDone() {
        _state.update {
            it.copy(
                doneMessage = null,
                screen = "home",
                activeReportId = null,
                selectedFeedbackReportId = null,
                selectedFeedbackDetail = null,
            )
        }
        refreshFeedbackReports()
    }

    fun clearBanner() {
        _state.update { it.copy(banner = null) }
    }

    private fun todayDayId(): String =
        LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE)

    private fun saveCursor(cursor: Int) {
        syncPrefs.edit().putInt("cursor", cursor).apply()
        _state.update { it.copy(syncCursor = cursor) }
    }

    private suspend fun handleApiError(e: ApiError) {
        val message = e.message
        if (e.isUnauthorized) {
            AuthService.signOut()
            shiftPrefs.edit().remove("shift_day_id").apply()
            _state.value = WorkerUiState(banner = message)
            return
        }
        _state.update { it.copy(busy = false, banner = message) }
    }
}
