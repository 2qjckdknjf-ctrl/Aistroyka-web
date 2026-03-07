package com.aistroyka.shared.repository.database.dao

import androidx.room.*
import com.aistroyka.shared.repository.database.entity.AppStateEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AppStateDao {
    @Query("SELECT * FROM app_state WHERE id = 'singleton'")
    fun getAppState(): Flow<AppStateEntity?>
    
    @Query("SELECT * FROM app_state WHERE id = 'singleton'")
    suspend fun getAppStateSync(): AppStateEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAppState(state: AppStateEntity)
    
    @Update
    suspend fun updateAppState(state: AppStateEntity)
    
    @Query("UPDATE app_state SET dayId = :dayId, shiftStartedAt = :startedAt, shiftEndedAt = :endedAt WHERE id = 'singleton'")
    suspend fun updateShiftState(dayId: String?, startedAt: String?, endedAt: String?)
    
    @Query("UPDATE app_state SET draftReportId = :reportId, draftTaskId = :taskId WHERE id = 'singleton'")
    suspend fun updateDraftReport(reportId: String?, taskId: String?)
    
    @Query("UPDATE app_state SET lastSyncCursor = :cursor WHERE id = 'singleton'")
    suspend fun updateSyncCursor(cursor: Long?)
}
