package com.aistroyka.manager.ui.screens.reports

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistroyka.shared.dto.ReportDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReportDetailViewModel @Inject constructor() : ViewModel() {
    
    private val _uiState = MutableStateFlow(ReportDetailUiState())
    val uiState: StateFlow<ReportDetailUiState> = _uiState.asStateFlow()
    
    fun loadReport(reportId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            // TODO: Implement report detail API call
            // For now, create placeholder
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                report = ReportDto(
                    id = reportId,
                    tenantId = "",
                    userId = "",
                    dayId = null,
                    taskId = null,
                    status = "pending",
                    createdAt = null,
                    submittedAt = null
                )
            )
        }
    }
    
    fun approveReport(reportId: String) {
        viewModelScope.launch {
            // TODO: Implement approve API call
            _uiState.value = _uiState.value.copy(
                report = _uiState.value.report?.copy(status = "approved")
            )
        }
    }
    
    fun rejectReport(reportId: String) {
        viewModelScope.launch {
            // TODO: Implement reject API call
            _uiState.value = _uiState.value.copy(
                report = _uiState.value.report?.copy(status = "rejected")
            )
        }
    }
}

data class ReportDetailUiState(
    val report: ReportDto? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
