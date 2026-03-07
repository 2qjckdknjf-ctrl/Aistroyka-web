package com.aistroyka.manager.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistroyka.shared.repository.ProjectRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val projectRepository: ProjectRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()
    
    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            // Load projects
            projectRepository.listProjects().fold(
                onSuccess = { projects ->
                    _uiState.value = _uiState.value.copy(
                        activeProjects = projects.size,
                        isLoading = false
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                }
            )
            
            // TODO: Load other KPIs (reports, tasks, team)
            // These would require additional endpoints
        }
    }
}

data class DashboardUiState(
    val activeProjects: Int = 0,
    val pendingReports: Int = 0,
    val activeTasks: Int = 0,
    val teamMembers: Int = 0,
    val isLoading: Boolean = false
)
