package com.aistroyka.worker.ui.screens.report

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistroyka.shared.repository.ReportRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReportCreateViewModel @Inject constructor(
    private val reportRepository: ReportRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ReportCreateUiState())
    val uiState: StateFlow<ReportCreateUiState> = _uiState.asStateFlow()
    
    fun updateTaskId(taskId: String) {
        _uiState.value = _uiState.value.copy(taskId = taskId)
    }
    
    fun createReport() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            
            val taskId = _uiState.value.taskId.takeIf { it.isNotBlank() }
            reportRepository.createReport(taskId = taskId).fold(
                onSuccess = { report ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isReportCreated = true,
                        reportId = report.id
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Failed to create report"
                    )
                }
            )
        }
    }
}

data class ReportCreateUiState(
    val taskId: String = "",
    val isLoading: Boolean = false,
    val isReportCreated: Boolean = false,
    val reportId: String? = null,
    val errorMessage: String? = null
)
