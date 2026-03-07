package com.aistroyka.worker.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aistroyka.shared.dto.TaskDto
import com.aistroyka.shared.repository.*
import com.aistroyka.shared.repository.database.OperationStatus
import com.google.gson.Gson
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val taskRepository: TaskRepository,
    private val operationQueue: OperationQueue,
    private val appStateRepository: AppStateRepository,
    private val gson: Gson
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    val pendingCount: StateFlow<Int> = operationQueue.getPendingCount()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)
    
    val isShiftActive: StateFlow<Boolean> = appStateRepository.isShiftActive()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)
    
    init {
        loadData()
        
        // Observe app state for shift info
        viewModelScope.launch {
            appStateRepository.getAppState().collect { state ->
                _uiState.value = _uiState.value.copy(
                    shiftStartTime = state?.shiftStartedAt,
                    dayId = state?.dayId
                )
            }
        }
    }
    
    fun loadData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
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
            val idempotencyKey = UUID.randomUUID().toString()
            val payload = mapOf<String, String?>() // Empty payload for startDay
            
            operationQueue.enqueueOperation(
                type = "startDay",
                payload = gson.toJson(payload),
                dependsOn = emptyList(),
                idempotencyKey = idempotencyKey
            )
            
            // The operation executor will handle the actual API call
            // App state will be updated when operation succeeds
        }
    }
    
    fun endShift() {
        viewModelScope.launch {
            val idempotencyKey = UUID.randomUUID().toString()
            val payload = mapOf<String, String?>() // Empty payload for endDay
            
            operationQueue.enqueueOperation(
                type = "endDay",
                payload = gson.toJson(payload),
                dependsOn = emptyList(),
                idempotencyKey = idempotencyKey
            )
        }
    }
}

data class HomeUiState(
    val tasks: List<TaskDto> = emptyList(),
    val isLoading: Boolean = false,
    val shiftStartTime: String? = null,
    val dayId: String? = null,
    val errorMessage: String? = null
)
