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
import ai.aistroyka.shared.SessionStore
import ai.aistroyka.shared.TaskDto
import ai.aistroyka.shared.WorkerApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream

data class WorkerUiState(
    val email: String = "",
    val password: String = "",
    /** login | home | report */
    val screen: String = "login",
    val busy: Boolean = false,
    val banner: String? = null,
    val configHint: String? = null,
    val projects: List<ProjectDto> = emptyList(),
    val selectedProjectId: String? = null,
    val tasks: List<TaskDto> = emptyList(),
    val selectedTaskId: String? = null,
    val activeReportId: String? = null,
    val photoLabel: String? = null,
    val pipelineStatus: String? = null,
    val photoAttached: Boolean = false,
    val submitMessage: String? = null,
    val doneMessage: String? = null,
)

class WorkerViewModel(application: Application) : AndroidViewModel(application) {

    private val _state = MutableStateFlow(WorkerUiState())
    val state: StateFlow<WorkerUiState> = _state.asStateFlow()

    init {
        if (SessionStore.hasSession()) {
            _state.update { it.copy(screen = "home", banner = null) }
            refreshBootstrap()
        }
    }

    fun setEmail(v: String) = _state.update { it.copy(email = v) }
    fun setPassword(v: String) = _state.update { it.copy(password = v) }

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
            } catch (e: ApiError) {
                _state.update { it.copy(busy = false, banner = e.message) }
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, banner = e.message ?: "Sign-in failed") }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            AuthService.signOut()
            _state.value = WorkerUiState()
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
                    cfg.clientProfile?.let { p -> "Profile: $p" }
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
            } catch (e: ApiError) {
                _state.update { it.copy(busy = false, banner = e.message) }
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
        val taskId = _state.value.selectedTaskId?.trim()?.takeIf { it.isNotEmpty() }
        viewModelScope.launch {
            _state.update {
                it.copy(
                    busy = true,
                    banner = null,
                    activeReportId = null,
                    photoLabel = null,
                    pipelineStatus = null,
                    photoAttached = false,
                    submitMessage = null,
                    doneMessage = null,
                )
            }
            try {
                val id = WorkerApi.createReport(
                    dayId = null,
                    taskId = taskId,
                    idempotencyKey = DeviceContext.newIdempotencyKey()
                )
                _state.update {
                    it.copy(
                        busy = false,
                        screen = "report",
                        activeReportId = id,
                        pipelineStatus = "Report draft created. Add a photo.",
                    )
                }
            } catch (e: ApiError) {
                _state.update { it.copy(busy = false, banner = e.message) }
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
                photoLabel = null,
                pipelineStatus = null,
                photoAttached = false,
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
        viewModelScope.launch {
            _state.update { it.copy(busy = true, pipelineStatus = "Preparing…", photoAttached = false, submitMessage = null) }
            try {
                val jpeg = compressJpeg(uri)
                val filename = "${reportId.take(8)}.jpg"
                _state.update { it.copy(pipelineStatus = "Creating upload session…") }
                val keyCreate = DeviceContext.newIdempotencyKey()
                val (sessionId, uploadPath) = WorkerApi.createUploadSession(
                    purpose = "report_before",
                    idempotencyKey = keyCreate
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
                    idempotencyKey = DeviceContext.newIdempotencyKey()
                )
                _state.update { it.copy(pipelineStatus = "Linking media to report…") }
                WorkerApi.addMedia(
                    reportId = reportId,
                    uploadSessionId = sessionId,
                    idempotencyKey = DeviceContext.newIdempotencyKey()
                )
                _state.update {
                    it.copy(
                        busy = false,
                        pipelineStatus = "Photo attached.",
                        photoAttached = true,
                    )
                }
            } catch (e: ApiError) {
                _state.update {
                    it.copy(
                        busy = false,
                        pipelineStatus = "Failed",
                        banner = e.message,
                    )
                }
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
        val reportId = _state.value.activeReportId ?: run {
            _state.update { it.copy(submitMessage = "No report id") }
            return
        }
        if (!_state.value.photoAttached && !BuildConfig.PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO) {
            _state.update { it.copy(submitMessage = "Attach a photo first") }
            return
        }
        val taskId = _state.value.selectedTaskId?.trim()?.takeIf { it.isNotEmpty() }
        viewModelScope.launch {
            _state.update { it.copy(busy = true, submitMessage = null) }
            try {
                WorkerApi.submitReport(
                    reportId = reportId,
                    taskId = taskId,
                    idempotencyKey = DeviceContext.newIdempotencyKey()
                )
                _state.update {
                    it.copy(
                        busy = false,
                        doneMessage = "Report submitted successfully.",
                        submitMessage = null,
                    )
                }
            } catch (e: ApiError) {
                _state.update { it.copy(busy = false, submitMessage = e.message) }
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, submitMessage = e.message ?: "Submit failed") }
            }
        }
    }

    fun dismissDone() {
        _state.update { it.copy(doneMessage = null, screen = "home", activeReportId = null) }
    }

    fun clearBanner() {
        _state.update { it.copy(banner = null) }
    }
}
