package com.aistroyka.shared.repository

import com.aistroyka.shared.repository.database.OperationStatus
import com.aistroyka.shared.repository.database.dao.OperationDao
import com.aistroyka.shared.repository.database.entity.OperationEntity
import com.aistroyka.shared.logging.Logger
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Operation queue matching iOS OperationQueueStore
 * Manages offline-first write operations with dependency resolution
 */
@Singleton
class OperationQueue @Inject constructor(
    private val operationDao: OperationDao,
    private val logger: Logger
) {
    
    fun getPendingCount(): Flow<Int> = operationDao.getPendingCount()
    
    fun getOperationsByStatus(statuses: List<OperationStatus>): Flow<List<OperationEntity>> {
        return operationDao.getOperationsByStatus(statuses)
    }
    
    suspend fun enqueueOperation(
        type: String,
        payload: String,
        dependsOn: List<String> = emptyList(),
        idempotencyKey: String = UUID.randomUUID().toString()
    ): String {
        val operationId = UUID.randomUUID().toString()
        val operation = OperationEntity(
            id = operationId,
            type = type,
            status = OperationStatus.QUEUED,
            payload = payload,
            dependsOn = dependsOn,
            idempotencyKey = idempotencyKey,
            attemptCount = 0,
            nextAttemptAt = null,
            errorMessage = null
        )
        operationDao.insertOperation(operation)
        logger.d("OperationQueue", "Enqueued operation: $type (id: $operationId)")
        return operationId
    }
    
    suspend fun getRunnableOperations(): List<OperationEntity> {
        val allQueued = operationDao.getOperationsByStatusSync(OperationStatus.QUEUED)
        val allRunning = operationDao.getOperationsByStatusSync(OperationStatus.RUNNING)
        val allOperations = allQueued + allRunning
        
        // Filter operations whose dependencies are satisfied
        val succeededIds = operationDao.getOperationsByStatusSync(OperationStatus.SUCCEEDED)
            .map { it.id }
            .toSet()
        
        return allOperations.filter { operation ->
            operation.dependsOn.all { depId -> depId in succeededIds }
        }
    }
    
    suspend fun markRunning(operationId: String) {
        val operation = operationDao.getOperationById(operationId) ?: return
        val updated = operation.copy(
            status = OperationStatus.RUNNING,
            updatedAt = System.currentTimeMillis()
        )
        operationDao.updateOperation(updated)
    }
    
    suspend fun markSucceeded(operationId: String) {
        val operation = operationDao.getOperationById(operationId) ?: return
        val updated = operation.copy(
            status = OperationStatus.SUCCEEDED,
            updatedAt = System.currentTimeMillis()
        )
        operationDao.updateOperation(updated)
    }
    
    suspend fun markFailed(operationId: String, errorMessage: String, isPermanent: Boolean = false) {
        val operation = operationDao.getOperationById(operationId) ?: return
        val updated = operation.copy(
            status = if (isPermanent) OperationStatus.FAILED_PERMANENT else OperationStatus.QUEUED,
            errorMessage = errorMessage,
            attemptCount = operation.attemptCount + 1,
            nextAttemptAt = if (!isPermanent) {
                calculateNextAttempt(operation.attemptCount + 1)
            } else null,
            updatedAt = System.currentTimeMillis()
        )
        operationDao.updateOperation(updated)
    }
    
    suspend fun markDeferred(operationId: String) {
        val operation = operationDao.getOperationById(operationId) ?: return
        val updated = operation.copy(
            status = OperationStatus.DEFERRED,
            updatedAt = System.currentTimeMillis()
        )
        operationDao.updateOperation(updated)
    }
    
    private fun calculateNextAttempt(attemptCount: Int): Long {
        // Exponential backoff: 2^attempt + random(0-1) seconds, max 300s
        val baseDelay = Math.pow(2.0, attemptCount.toDouble()).toLong()
        val randomJitter = (Math.random() * 1000).toLong()
        val delayMs = (baseDelay * 1000 + randomJitter).coerceAtMost(300_000L)
        return System.currentTimeMillis() + delayMs
    }
    
    suspend fun getOperationById(operationId: String): OperationEntity? {
        return operationDao.getOperationById(operationId)
    }
    
    suspend fun cleanupOldOperations() {
        val oneWeekAgo = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000L)
        operationDao.deleteOldSucceeded(oneWeekAgo)
    }
}
