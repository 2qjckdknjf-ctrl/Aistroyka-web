package com.aistroyka.worker.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistroyka.shared.dto.TaskDto
import com.aistroyka.shared.repository.TaskRepository
import com.aistroyka.shared.repository.WorkerDayRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val taskRepository: TaskRepository,
    private val workerDayRepository: WorkerDayRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    fun loadData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            // Load tasks
            taskRepository.getTodayTasks().fold(
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
    
    fun startShift() {
        viewModelScope.launch {
            workerDayRepository.startDay().fold(
                onSuccess = { workerDay ->
                    _uiState.value = _uiState.value.copy(
                        isShiftActive = true,
                        shiftStartTime = workerDay.startedAt ?: ""
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        errorMessage = error.message
                    )
                }
            )
        }
    }
    
    fun endShift() {
        viewModelScope.launch {
            workerDayRepository.endDay().fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isShiftActive = false,
                        shiftStartTime = null
                    )
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

data class HomeUiState(
    val tasks: List<TaskDto> = emptyList(),
    val isLoading: Boolean = false,
    val isShiftActive: Boolean = false,
    val shiftStartTime: String? = null,
    val errorMessage: String? = null
)
