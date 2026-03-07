package com.aistroyka.manager.ui.screens.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistroyka.shared.dto.TaskDto
import com.aistroyka.shared.repository.TaskRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val taskRepository: TaskRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(TasksUiState())
    val uiState: StateFlow<TasksUiState> = _uiState.asStateFlow()
    
    fun loadTasks() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            // For manager, we'd need a different endpoint to get all tasks
            // For now, using today's tasks as placeholder
            taskRepository.getTodayTasks(clientProfile = "full").fold(
                onSuccess = { tasks ->
                    _uiState.value = _uiState.value.copy(
                        tasks = tasks,
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
}

data class TasksUiState(
    val tasks: List<TaskDto> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
