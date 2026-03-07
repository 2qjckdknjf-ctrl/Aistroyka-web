package com.aistroyka.worker.ui.screens.task

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
class TaskDetailViewModel @Inject constructor(
    private val taskRepository: TaskRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(TaskDetailUiState())
    val uiState: StateFlow<TaskDetailUiState> = _uiState.asStateFlow()
    
    fun loadTask(taskId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            // For now, fetch all tasks and find the one
            // In production, add getTaskById endpoint
            taskRepository.getTodayTasks().fold(
                onSuccess = { tasks ->
                    val task = tasks.find { it.id == taskId }
                    _uiState.value = _uiState.value.copy(
                        task = task,
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

data class TaskDetailUiState(
    val task: TaskDto? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
