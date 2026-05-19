package ai.aistroyka.manager

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import ai.aistroyka.shared.ApiError
import ai.aistroyka.shared.AuthService
import ai.aistroyka.shared.GetStartedDto
import ai.aistroyka.shared.HelpApi
import ai.aistroyka.shared.HelpAssistantRiskSignalDto
import ai.aistroyka.shared.HelpHintDto
import ai.aistroyka.shared.ManagerApi
import ai.aistroyka.shared.ProjectDto
import ai.aistroyka.shared.ReportAnalysisStatusDto
import ai.aistroyka.shared.ReportDetailDto
import ai.aistroyka.shared.ReportListItemDto
import ai.aistroyka.shared.SessionStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.Locale

data class ManagerUiState(
    val email: String = "",
    val password: String = "",
    val screen: String = "login",
    val busy: Boolean = false,
    val banner: String? = null,
    val meSummary: String? = null,
    val projects: List<ProjectDto> = emptyList(),
    val selectedProjectId: String? = null,
    val reportsFilterSubmittedOnly: Boolean = true,
    val reports: List<ReportListItemDto> = emptyList(),
    val opsPendingLine: String? = null,
    val selectedReportId: String? = null,
    val reportDetail: ReportDetailDto? = null,
    val analysisStatus: ReportAnalysisStatusDto? = null,
    val getStarted: GetStartedDto? = null,
    val helpHints: List<HelpHintDto> = emptyList(),
    val guideSummary: String? = null,
    val guideConfidence: Int? = null,
    val guideRiskSignals: List<HelpAssistantRiskSignalDto> = emptyList(),
    /** media row id -> preview URL from `GET projects/:id/media` */
    val mediaPreviewUrls: Map<String, String> = emptyMap(),
    val reviewNote: String = "",
    val reviewValidationError: String? = null,
    val actionMessage: String? = null,
)

class ManagerViewModel(application: Application) : AndroidViewModel(application) {

    private val _state = MutableStateFlow(ManagerUiState())
    val state: StateFlow<ManagerUiState> = _state.asStateFlow()

    init {
        if (SessionStore.hasSession()) {
            _state.update { it.copy(screen = "home") }
            refreshBootstrap()
        }
    }

    fun setEmail(v: String) = _state.update { it.copy(email = v) }
    fun setPassword(v: String) = _state.update { it.copy(password = v) }
    fun setReviewNote(v: String) = _state.update { it.copy(reviewNote = v, reviewValidationError = null) }
    fun setReportsFilterSubmittedOnly(v: Boolean) = _state.update { it.copy(reportsFilterSubmittedOnly = v) }

    fun clearBanner() = _state.update { it.copy(banner = null) }
    fun clearActionMessage() = _state.update { it.copy(actionMessage = null) }

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
                _state.update { it.copy(busy = false, screen = "home") }
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
            _state.value = ManagerUiState()
        }
    }

    fun refreshBootstrap() {
        viewModelScope.launch {
            _state.update { it.copy(busy = true, banner = null) }
            try {
                val me = ManagerApi.me().data
                val projects = ManagerApi.projects()
                val meSummary = listOfNotNull(
                    me?.role?.let { r -> "Role: $r" },
                    me?.tenantId?.let { t -> "Tenant: ${t.take(8)}…" }
                ).joinToString(" · ").ifEmpty { "Signed in" }
                val overview = try {
                    ManagerApi.opsOverview(limit = 15, projectId = _state.value.selectedProjectId)
                } catch (_: Exception) {
                    null
                }
                val pending = overview?.queues?.reportsPendingReview?.size ?: 0
                val opsLine = "Reports pending review (ops queue): $pending"
                val first = projects.firstOrNull()?.id
                val role = mapHelpRole(me?.role)
                val locale = supportedHelpLocale()
                val activationStatus = try {
                    HelpApi.activationStatus()
                } catch (_: Exception) {
                    null
                }
                val helpHints = if (activationStatus?.getStarted != null) {
                    try {
                        HelpApi.helpHints(
                            locale = locale,
                            role = role,
                            getStarted = activationStatus.getStarted
                        )
                    } catch (_: Exception) {
                        emptyList()
                    }
                } else {
                    emptyList()
                }
                val assistant = try {
                    HelpApi.helpAssistant(
                        query = "",
                        locale = locale,
                        role = role,
                        pathname = "/dashboard",
                        getStarted = activationStatus?.getStarted,
                        projectCount = activationStatus?.projectCount,
                        taskCount = activationStatus?.taskCount,
                        reportCount = activationStatus?.reportCount,
                        hasAiInsight = activationStatus?.hasAiInsight,
                    )
                } catch (_: Exception) {
                    null
                }
                try {
                    HelpApi.helpAssistantEvent(
                        type = "open",
                        locale = locale,
                        role = role,
                        pathname = "/dashboard",
                    )
                } catch (_: Exception) {
                }
                _state.update {
                    it.copy(
                        busy = false,
                        meSummary = meSummary,
                        projects = projects,
                        selectedProjectId = it.selectedProjectId ?: first,
                        opsPendingLine = opsLine,
                        getStarted = activationStatus?.getStarted,
                        helpHints = helpHints,
                        guideSummary = assistant?.summary,
                        guideConfidence = assistant?.confidence,
                        guideRiskSignals = assistant?.riskSignals.orEmpty(),
                    )
                }
            } catch (e: ApiError) {
                _state.update { it.copy(busy = false, banner = e.message) }
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, banner = e.message ?: "Bootstrap failed") }
            }
        }
    }

    fun selectProject(id: String?) {
        _state.update { it.copy(selectedProjectId = id) }
        refreshBootstrap()
    }

    fun openReports() {
        _state.update { it.copy(screen = "reports", banner = null) }
        loadReports()
    }

    fun backToHome() {
        _state.update {
            it.copy(
                screen = "home",
                selectedReportId = null,
                reportDetail = null,
                analysisStatus = null,
                mediaPreviewUrls = emptyMap(),
                reviewNote = "",
                reviewValidationError = null,
            )
        }
    }

    fun loadReports() {
        viewModelScope.launch {
            _state.update { it.copy(busy = true, banner = null) }
            try {
                val st = if (_state.value.reportsFilterSubmittedOnly) "submitted" else null
                // Tenant-wide list: server-side project filter uses resolved project_id (day/task).
                // Reports created without day/task have no project_id and would vanish if we always pass selectedProjectId.
                val list = ManagerApi.reports(
                    projectId = null,
                    status = st,
                    limit = 100
                )
                _state.update { it.copy(busy = false, reports = list) }
            } catch (e: ApiError) {
                _state.update { it.copy(busy = false, banner = e.message) }
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, banner = e.message ?: "Failed to load reports") }
            }
        }
    }

    fun openReportDetail(reportId: String) {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    screen = "detail",
                    selectedReportId = reportId,
                    busy = true,
                    banner = null,
                    reportDetail = null,
                    analysisStatus = null,
                    mediaPreviewUrls = emptyMap(),
                    reviewNote = "",
                    reviewValidationError = null,
                    actionMessage = null,
                )
            }
            try {
                val detail = ManagerApi.reportDetail(reportId)
                val listRow = _state.value.reports.find { it.id == reportId }
                var projectId = listRow?.projectId
                val taskId = detail.taskId
                if (projectId.isNullOrBlank() && !taskId.isNullOrBlank()) {
                    projectId = try {
                        ManagerApi.taskDetail(taskId).projectId
                    } catch (_: Exception) {
                        null
                    }
                }
                val urlMap = mutableMapOf<String, String>()
                if (!projectId.isNullOrBlank()) {
                    try {
                        val media = ManagerApi.projectMedia(projectId, limit = 50)
                        for (m in media) {
                            urlMap[m.id] = m.fileUrl
                        }
                    } catch (_: Exception) {
                    }
                }
                val analysis = try {
                    ManagerApi.reportAnalysisStatus(reportId)
                } catch (_: Exception) {
                    null
                }
                _state.update {
                    it.copy(
                        busy = false,
                        reportDetail = detail,
                        mediaPreviewUrls = urlMap,
                        analysisStatus = analysis,
                    )
                }
            } catch (e: ApiError) {
                _state.update { it.copy(busy = false, banner = e.message) }
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, banner = e.message ?: "Load failed") }
            }
        }
    }

    fun backToReports() {
        _state.update {
            it.copy(
                screen = "reports",
                selectedReportId = null,
                reportDetail = null,
                analysisStatus = null,
                mediaPreviewUrls = emptyMap(),
                reviewNote = "",
                reviewValidationError = null,
                actionMessage = null,
            )
        }
    }

    fun submitReview(status: String) {
        val id = _state.value.selectedReportId ?: return
        val noteRaw = _state.value.reviewNote.trim()
        val requiresNote = status == "rejected" || status == "changes_requested"
        if (requiresNote && noteRaw.isEmpty()) {
            _state.update {
                it.copy(
                    reviewValidationError = "manager_note_required_reject_or_changes",
                    actionMessage = null,
                )
            }
            return
        }
        val note = noteRaw.ifEmpty { null }
        viewModelScope.launch {
            _state.update { it.copy(busy = true, banner = null, actionMessage = null, reviewValidationError = null) }
            try {
                val updated = ManagerApi.reportReview(reportId = id, status = status, managerNote = note)
                _state.update {
                    val refreshed = it.reports.map { row ->
                        if (row.id == id) {
                            row.copy(status = updated.status)
                        } else {
                            row
                        }
                    }
                    it.copy(
                        busy = false,
                        reportDetail = updated,
                        reports = refreshed,
                        actionMessage = "Review saved: $status",
                    )
                }
            } catch (e: ApiError) {
                _state.update { it.copy(busy = false, banner = e.message) }
            } catch (e: Exception) {
                _state.update { it.copy(busy = false, banner = e.message ?: "Review failed") }
            }
        }
    }

    private fun mapHelpRole(role: String?): String {
        return when (role?.lowercase(Locale.ROOT)) {
            "admin" -> "admin"
            "client" -> "client"
            "owner" -> "owner"
            else -> "manager"
        }
    }

    private fun supportedHelpLocale(): String {
        val language = Locale.getDefault().language.lowercase(Locale.ROOT)
        return when (language) {
            "ru", "es", "it" -> language
            else -> "en"
        }
    }
}
