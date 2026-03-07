package com.aistroyka.shared.repository

import com.aistroyka.shared.logging.Logger
import kotlinx.coroutines.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Operation queue processor matching iOS operation queue execution
 * Continuously processes queued operations when online
 */
@Singleton
class OperationQueueProcessor @Inject constructor(
    private val operationQueue: OperationQueue,
    private val operationExecutor: OperationExecutor,
    private val networkMonitor: NetworkMonitor,
    private val logger: Logger
) {
    private var processingJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    fun start() {
        if (processingJob?.isActive == true) return
        
        processingJob = scope.launch {
            while (isActive) {
                try {
                    if (!networkMonitor.isConnected.value) {
                        delay(5000) // Wait 5 seconds when offline
                        continue
                    }
                    
                    val runnable = operationQueue.getRunnableOperations()
                    
                    if (runnable.isEmpty()) {
                        delay(5000) // Idle sleep: 5 seconds when no work
                        continue
                    }
                    
                    // Process operations (max 1 at a time for uploads, but allow parallel for others)
                    runnable.forEach { operation ->
                        if (!isActive) return@forEach
                        
                        try {
                            val result = operationExecutor.executeOperation(operation)
                            
                            when (result) {
                                is OperationResult.Success -> {
                                    logger.d("OperationQueueProcessor", "Operation ${operation.id} succeeded")
                                }
                                is OperationResult.Retry -> {
                                    logger.d("OperationQueueProcessor", "Operation ${operation.id} will retry: ${result.message}")
                                }
                                is OperationResult.Permanent -> {
                                    logger.w("OperationQueueProcessor", "Operation ${operation.id} failed permanently: ${result.message}")
                                }
                                is OperationResult.AuthRequired -> {
                                    logger.w("OperationQueueProcessor", "Auth required, pausing queue")
                                    // Pause queue - UI should prompt for re-auth
                                }
                                is OperationResult.NeedsBootstrap -> {
                                    logger.w("OperationQueueProcessor", "Sync conflict, needs bootstrap")
                                    // Trigger bootstrap
                                }
                                is OperationResult.Deferred -> {
                                    logger.d("OperationQueueProcessor", "Operation ${operation.id} deferred (background upload)")
                                }
                            }
                        } catch (e: Exception) {
                            logger.e("OperationQueueProcessor", "Error processing operation ${operation.id}", e)
                        }
                    }
                    
                    delay(1000) // Small delay between batches
                    
                } catch (e: Exception) {
                    logger.e("OperationQueueProcessor", "Error in processing loop", e)
                    delay(5000)
                }
            }
        }
    }
    
    fun stop() {
        processingJob?.cancel()
        processingJob = null
    }
}
