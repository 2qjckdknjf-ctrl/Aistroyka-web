package com.aistroyka.worker

import android.app.Application
import com.aistroyka.shared.repository.AppStateRepository
import com.aistroyka.shared.repository.OperationQueueProcessor
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltAndroidApp
class WorkerApplication : Application() {
    
    @Inject
    lateinit var appStateRepository: AppStateRepository
    
    @Inject
    lateinit var operationQueueProcessor: OperationQueueProcessor
    
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize app state
        applicationScope.launch {
            appStateRepository.initializeIfNeeded()
        }
        
        // Start operation queue processor
        operationQueueProcessor.start()
    }
}
