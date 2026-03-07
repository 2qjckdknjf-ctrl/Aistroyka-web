package com.aistroyka.shared.repository

import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.auth.TokenStorage
import com.aistroyka.shared.device.IdempotencyKeyGenerator
import com.aistroyka.shared.dto.*
import com.aistroyka.shared.error.ApiError
import com.aistroyka.shared.error.ApiException
import com.aistroyka.shared.logging.Logger
import com.aistroyka.shared.repository.database.OperationStatus
import com.aistroyka.shared.repository.database.entity.OperationEntity
import com.google.gson.Gson
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Operation executor matching iOS OperationQueueExecutor
 * Processes queued operations with retry logic and error handling
 */
@Singleton
class OperationExecutor @Inject constructor(
    private val operationQueue: OperationQueue,
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage,
    private val reportRepository: ReportRepository,
    private val workerDayRepository: WorkerDayRepository,
    private val logger: Logger,
    private val gson: Gson
) {
    private val _isRunning = MutableStateFlow(false)
    val isRunning: StateFlow<Boolean> = _isRunning.asStateFlow()
    
    private val CLIENT_LITE = "android_lite"
    
    suspend fun executeOperation(operation: OperationEntity): OperationResult {
        return try {
            operationQueue.markRunning(operation.id)
            
            when (operation.type) {
                "createReport" -> executeCreateReport(operation)
                "startDay" -> executeStartDay(operation)
                "endDay" -> executeEndDay(operation)
                "submitReport" -> executeSubmitReport(operation)
                "addMedia" -> executeAddMedia(operation)
                else -> {
                    logger.w("OperationExecutor", "Unknown operation type: ${operation.type}")
                    OperationResult.Permanent("Unknown operation type")
                }
            }
        } catch (e: Exception) {
            logger.e("OperationExecutor", "Error executing operation ${operation.id}", e)
            OperationResult.Retry("Execution error: ${e.message}")
        }
    }
    
    private suspend fun executeCreateReport(operation: OperationEntity): OperationResult {
        val payload = gson.fromJson(operation.payload, CreateReportRequest::class.java)
        val result = reportRepository.createReport(payload.dayId, payload.taskId)
        
        return result.fold(
            onSuccess = {
                operationQueue.markSucceeded(operation.id)
                OperationResult.Success
            },
            onFailure = { error ->
                handleError(operation, error)
            }
        )
    }
    
    private suspend fun executeStartDay(operation: OperationEntity): OperationResult {
        val result = workerDayRepository.startDay()
        
        return result.fold(
            onSuccess = {
                operationQueue.markSucceeded(operation.id)
                OperationResult.Success
            },
            onFailure = { error ->
                handleError(operation, error)
            }
        )
    }
    
    private suspend fun executeEndDay(operation: OperationEntity): OperationResult {
        val result = workerDayRepository.endDay()
        
        return result.fold(
            onSuccess = {
                operationQueue.markSucceeded(operation.id)
                OperationResult.Success
            },
            onFailure = { error ->
                handleError(operation, error)
            }
        )
    }
    
    private suspend fun executeSubmitReport(operation: OperationEntity): OperationResult {
        val payload = gson.fromJson(operation.payload, SubmitReportRequest::class.java)
        val result = reportRepository.submitReport(payload.reportId)
        
        return result.fold(
            onSuccess = {
                operationQueue.markSucceeded(operation.id)
                OperationResult.Success
            },
            onFailure = { error ->
                handleError(operation, error)
            }
        )
    }
    
    private suspend fun executeAddMedia(operation: OperationEntity): OperationResult {
        val payload = gson.fromJson(operation.payload, AddMediaRequest::class.java)
        val result = reportRepository.addMedia(
            payload.reportId,
            payload.uploadSessionId,
            payload.purpose
        )
        
        return result.fold(
            onSuccess = {
                operationQueue.markSucceeded(operation.id)
                OperationResult.Success
            },
            onFailure = { error ->
                handleError(operation, error)
            }
        )
    }
    
    private suspend fun handleError(operation: OperationEntity, error: Throwable): OperationResult {
        val apiError = when (error) {
            is ApiException -> error.error
            else -> null
        }
        
        return when {
            apiError is ApiError.Unauthorized || apiError is ApiError.Forbidden -> {
                logger.w("OperationExecutor", "Auth required, pausing queue")
                OperationResult.AuthRequired
            }
            apiError is ApiError.Conflict -> {
                logger.w("OperationExecutor", "Conflict detected: ${apiError.code}")
                OperationResult.NeedsBootstrap
            }
            apiError is ApiError.RateLimited || 
            apiError is ApiError.ServerError ||
            apiError is ApiError.NetworkError -> {
                // Retryable
                if (operation.attemptCount >= 8) {
                    operationQueue.markFailed(operation.id, error.message ?: "Max attempts reached", true)
                    OperationResult.Permanent(error.message ?: "Max attempts reached")
                } else {
                    operationQueue.markFailed(operation.id, error.message ?: "Retryable error", false)
                    OperationResult.Retry(error.message ?: "Retryable error")
                }
            }
            else -> {
                // Permanent error (4xx except 401/403/409)
                operationQueue.markFailed(operation.id, error.message ?: "Permanent error", true)
                OperationResult.Permanent(error.message ?: "Permanent error")
            }
        }
    }
}

sealed class OperationResult {
    object Success : OperationResult()
    data class Retry(val message: String) : OperationResult()
    data class Permanent(val message: String) : OperationResult()
    object AuthRequired : OperationResult()
    object NeedsBootstrap : OperationResult()
    object Deferred : OperationResult() // For background uploads
}
