package com.aistroyka.shared.repository.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.aistroyka.shared.repository.SyncService
import javax.inject.Inject

/**
 * WorkManager worker for background sync
 * Runs periodic sync in the background
 */
class SyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    @Inject
    lateinit var syncService: SyncService
    
    override suspend fun doWork(): Result {
        return try {
            // Bootstrap if needed, then fetch changes
            val bootstrapResult = syncService.bootstrap()
            if (bootstrapResult.isFailure) {
                return Result.retry()
            }
            
            // Fetch changes
            val changesResult = syncService.fetchChanges()
            if (changesResult.isFailure) {
                return Result.retry()
            }
            
            changesResult.getOrNull()?.let { changes ->
                // Ack cursor
                val cursor = changes.nextCursor
                syncService.ack(cursor)
            }
            
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
