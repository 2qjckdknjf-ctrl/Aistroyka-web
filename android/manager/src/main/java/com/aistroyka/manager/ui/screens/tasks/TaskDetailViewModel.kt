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
class TaskDetailViewModel @Inject constructor(
    private val taskRepository: TaskRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(TaskDetailUiState())
    val uiState: StateFlow<TaskDetailUiState> = _uiState.asStateFlow()
    
    fun loadTask(taskId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            // For now, fetch all tasks and find the one
            // TODO: Add getTaskById endpoint
            taskRepository.getTodayTasks(clientProfile = "full").fold(
                onSuccess = { tasks ->
                    val task = tasks.find { it.id == taskId }
                    _uiState.value = _uiState.value.copy(
                        task = task,
                        isLoading = false,
                        canAssign = task != null
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
    
    fun updateAssignToUserId(userId: String) {
        _uiState.value = _uiState.value.copy(assignToUserId = userId)
    }
    
    fun assignTask(taskId: String) {
        viewModelScope.launch {
            // TODO: Implement assign API call
            _uiState.value = _uiState.value.copy(
                task = _uiState.value.task?.copy(assignedTo = _uiState.value.assignToUserId)
            )
        }
    }
}

data class TaskDetailUiState(
    val task: TaskDto? = null,
    val isLoading: Boolean = false,
    val canAssign: Boolean = false,
    val assignToUserId: String = "",
    val errorMessage: String? = null
)
