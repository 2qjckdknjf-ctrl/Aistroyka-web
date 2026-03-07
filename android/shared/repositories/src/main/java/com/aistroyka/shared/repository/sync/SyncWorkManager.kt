package com.aistroyka.shared.repository.sync

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

/**
 * WorkManager manager for background sync
 * Schedules periodic sync work
 */
@Singleton
class SyncWorkManager @Inject constructor(
    private val context: Context
) {
    private val workManager = WorkManager.getInstance(context)
    
    fun schedulePeriodicSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        
        val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
            15, TimeUnit.MINUTES, // Minimum interval
            5, TimeUnit.MINUTES    // Flex interval
        )
            .setConstraints(constraints)
            .addTag("sync")
            .build()
        
        workManager.enqueueUniquePeriodicWork(
            "sync_work",
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
    }
    
    fun cancelSync() {
        workManager.cancelUniqueWork("sync_work")
    }
}
