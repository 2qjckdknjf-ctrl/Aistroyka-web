package com.aistroyka.manager.ui.screens.projects

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistroyka.shared.dto.ProjectDto
import com.aistroyka.shared.repository.ProjectRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProjectsViewModel @Inject constructor(
    private val projectRepository: ProjectRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ProjectsUiState())
    val uiState: StateFlow<ProjectsUiState> = _uiState.asStateFlow()
    
    fun loadProjects() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            projectRepository.listProjects().fold(
                onSuccess = { projects ->
                    _uiState.value = _uiState.value.copy(
                        projects = projects,
                        isLoading = false
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message
                    )
                }
            )
        }
    }
    
    fun showCreateDialog() {
        _uiState.value = _uiState.value.copy(showCreateDialog = true)
    }
    
    fun hideCreateDialog() {
        _uiState.value = _uiState.value.copy(showCreateDialog = false)
    }
    
    fun createProject(name: String) {
        viewModelScope.launch {
            projectRepository.createProject(name).fold(
                onSuccess = {
                    loadProjects() // Refresh list
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        errorMessage = error.message
                    )
                }
            )
        }
    }
}

data class ProjectsUiState(
    val projects: List<ProjectDto> = emptyList(),
    val isLoading: Boolean = false,
    val showCreateDialog: Boolean = false,
    val errorMessage: String? = null
)
