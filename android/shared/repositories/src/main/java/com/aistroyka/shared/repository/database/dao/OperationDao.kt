package com.aistroyka.shared.repository.database.dao

import androidx.room.*
import com.aistroyka.shared.repository.database.OperationStatus
import com.aistroyka.shared.repository.database.entity.OperationEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface OperationDao {
    @Query("SELECT * FROM operations WHERE status IN (:statuses) ORDER BY createdAt ASC")
    fun getOperationsByStatus(statuses: List<OperationStatus>): Flow<List<OperationEntity>>
    
    @Query("SELECT * FROM operations WHERE status = :status ORDER BY createdAt ASC")
    suspend fun getOperationsByStatusSync(status: OperationStatus): List<OperationEntity>
    
    @Query("SELECT * FROM operations WHERE id = :id")
    suspend fun getOperationById(id: String): OperationEntity?
    
    @Query("SELECT * FROM operations WHERE status IN ('QUEUED', 'RUNNING') AND (nextAttemptAt IS NULL OR nextAttemptAt <= :now) ORDER BY createdAt ASC")
    suspend fun getRunnableOperations(now: Long = System.currentTimeMillis()): List<OperationEntity>
    
    @Query("SELECT COUNT(*) FROM operations WHERE status IN ('QUEUED', 'RUNNING')")
    fun getPendingCount(): Flow<Int>
    
    @Query("SELECT * FROM operations WHERE id IN (:ids)")
    suspend fun getOperationsByIds(ids: List<String>): List<OperationEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOperation(operation: OperationEntity)
    
    @Update
    suspend fun updateOperation(operation: OperationEntity)
    
    @Delete
    suspend fun deleteOperation(operation: OperationEntity)
    
    @Query("DELETE FROM operations WHERE status = 'SUCCEEDED' AND updatedAt < :before")
    suspend fun deleteOldSucceeded(before: Long)
}
