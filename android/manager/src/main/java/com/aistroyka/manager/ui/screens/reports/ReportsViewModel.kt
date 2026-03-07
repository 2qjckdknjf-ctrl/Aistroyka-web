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
class ReportsViewModel @Inject constructor() : ViewModel() {
    
    private val _uiState = MutableStateFlow(ReportsUiState())
    val uiState: StateFlow<ReportsUiState> = _uiState.asStateFlow()
    
    fun loadReports() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            // TODO: Implement reports list API call
            // For now, return empty list
            _uiState.value = _uiState.value.copy(
                reports = emptyList(),
                isLoading = false
            )
        }
    }
}

data class ReportsUiState(
    val reports: List<ReportDto> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
