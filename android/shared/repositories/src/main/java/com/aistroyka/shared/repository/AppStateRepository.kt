package com.aistroyka.shared.repository

import com.aistroyka.shared.repository.database.dao.AppStateDao
import com.aistroyka.shared.repository.database.entity.AppStateEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * App state repository matching iOS AppStateStore
 * Manages persistent app state (shift, draft report, sync cursor)
 */
@Singleton
class AppStateRepository @Inject constructor(
    private val appStateDao: AppStateDao
) {
    
    fun getAppState(): Flow<AppStateEntity?> = appStateDao.getAppState()
    
    suspend fun getAppStateSync(): AppStateEntity? = appStateDao.getAppStateSync()
    
    suspend fun initializeIfNeeded() {
        val existing = appStateDao.getAppStateSync()
        if (existing == null) {
            appStateDao.insertAppState(AppStateEntity())
        }
    }
    
    suspend fun updateShiftState(dayId: String?, startedAt: String?, endedAt: String?) {
        appStateDao.updateShiftState(dayId, startedAt, endedAt)
    }
    
    suspend fun updateDraftReport(reportId: String?, taskId: String?) {
        appStateDao.updateDraftReport(reportId, taskId)
    }
    
    suspend fun updateSyncCursor(cursor: Long?) {
        appStateDao.updateSyncCursor(cursor)
    }
    
    suspend fun updateSelectedProject(projectId: String?) {
        val current = appStateDao.getAppStateSync() ?: AppStateEntity()
        val updated = current.copy(selectedProjectId = projectId)
        appStateDao.updateAppState(updated)
    }
    
    fun isShiftActive(): Flow<Boolean> {
        return appStateDao.getAppState().map { state ->
            state?.shiftStartedAt != null && state.shiftEndedAt == null
        }
    }
}
