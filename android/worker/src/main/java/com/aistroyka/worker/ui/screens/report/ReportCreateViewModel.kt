package com.aistroyka.worker.ui.screens.report

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistroyka.shared.repository.AppStateRepository
import com.aistroyka.shared.repository.OperationQueue
import com.aistroyka.shared.repository.PhotoUploadService
import com.aistroyka.shared.repository.database.OperationStatus
import com.google.gson.Gson
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class ReportCreateViewModel @Inject constructor(
    private val operationQueue: OperationQueue,
    private val photoUploadService: PhotoUploadService,
    private val appStateRepository: AppStateRepository,
    private val gson: Gson
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ReportCreateUiState())
    val uiState: StateFlow<ReportCreateUiState> = _uiState.asStateFlow()
    
    private var reportId: String? = null
    private var beforePhotoItem: PhotoUploadService.PhotoUploadItem? = null
    private var afterPhotoItem: PhotoUploadService.PhotoUploadItem? = null
    
    init {
        // Load draft report if exists
        viewModelScope.launch {
            appStateRepository.getAppState().collect { state ->
                state?.draftReportId?.let { draftId ->
                    reportId = draftId
                    _uiState.value = _uiState.value.copy(
                        reportId = draftId,
                        isReportCreated = true
                    )
                }
            }
        }
        
        // Observe upload items
        viewModelScope.launch {
            photoUploadService.uploadItems.collect { items ->
                val beforeItem = items.find { it.purpose == "report_before" }
                val afterItem = items.find { it.purpose == "report_after" }
                
                _uiState.value = _uiState.value.copy(
                    beforePhotoPhase = beforeItem?.phase ?: PhotoUploadService.UploadPhase.QUEUED,
                    beforePhotoError = beforeItem?.error,
                    afterPhotoPhase = afterItem?.phase ?: PhotoUploadService.UploadPhase.QUEUED,
                    afterPhotoError = afterItem?.error,
                    canSubmit = beforeItem?.phase == PhotoUploadService.UploadPhase.DONE &&
                            afterItem?.phase == PhotoUploadService.UploadPhase.DONE &&
                            reportId != null
                )
            }
        }
    }
    
    fun createReport(taskId: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            
            val draftId = UUID.randomUUID().toString()
            val payload = mapOf(
                "day_id" to appStateRepository.getAppStateSync()?.dayId,
                "task_id" to taskId
            )
            
            val operationId = operationQueue.enqueueOperation(
                type = "createReport",
                payload = gson.toJson(payload),
                dependsOn = emptyList()
            )
            
            // Store draft report ID
            appStateRepository.updateDraftReport(draftId, taskId)
            reportId = draftId
            
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isReportCreated = true,
                reportId = draftId
            )
        }
    }
    
    fun captureBeforePhoto(bitmap: Bitmap) {
        viewModelScope.launch {
            if (reportId == null) {
                createReport()
            }
            
            val item = photoUploadService.enqueuePhoto("report_before")
            beforePhotoItem = item
            
            reportId?.let { id ->
                photoUploadService.uploadPhoto(bitmap, item.id, id)
            }
        }
    }
    
    fun captureAfterPhoto(bitmap: Bitmap) {
        viewModelScope.launch {
            if (reportId == null) {
                createReport()
            }
            
            val item = photoUploadService.enqueuePhoto("report_after")
            afterPhotoItem = item
            
            reportId?.let { id ->
                photoUploadService.uploadPhoto(bitmap, item.id, id)
            }
        }
    }
    
    fun retryBeforePhoto(bitmap: Bitmap) {
        beforePhotoItem?.let { item ->
            reportId?.let { id ->
                photoUploadService.retryUpload(item.id, bitmap, id)
            }
        }
    }
    
    fun retryAfterPhoto(bitmap: Bitmap) {
        afterPhotoItem?.let { item ->
            reportId?.let { id ->
                photoUploadService.retryUpload(item.id, bitmap, id)
            }
        }
    }
    
    fun submitReport() {
        viewModelScope.launch {
            val currentReportId = reportId ?: return@launch
            
            _uiState.value = _uiState.value.copy(isSubmitting = true, errorMessage = null)
            
            val payload = mapOf("report_id" to currentReportId)
            val createReportOp = operationQueue.getRunnableOperations()
                .find { it.type == "createReport" }
            
            val dependsOn = if (createReportOp != null) {
                listOf(createReportOp.id)
            } else {
                emptyList()
            }
            
            operationQueue.enqueueOperation(
                type = "submitReport",
                payload = gson.toJson(payload),
                dependsOn = dependsOn
            )
            
            // Clear draft
            appStateRepository.updateDraftReport(null, null)
            
            _uiState.value = _uiState.value.copy(
                isSubmitting = false,
                isReportSubmitted = true
            )
        }
    }
}

data class ReportCreateUiState(
    val reportId: String? = null,
    val isLoading: Boolean = false,
    val isReportCreated: Boolean = false,
    val isSubmitting: Boolean = false,
    val isReportSubmitted: Boolean = false,
    val beforePhotoPhase: PhotoUploadService.UploadPhase = PhotoUploadService.UploadPhase.QUEUED,
    val beforePhotoError: String? = null,
    val afterPhotoPhase: PhotoUploadService.UploadPhase = PhotoUploadService.UploadPhase.QUEUED,
    val afterPhotoError: String? = null,
    val canSubmit: Boolean = false,
    val errorMessage: String? = null
)
