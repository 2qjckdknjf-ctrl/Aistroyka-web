package com.aistroyka.shared.repository.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.aistroyka.shared.repository.database.OperationStatus
import java.util.Date

@Entity(tableName = "operations")
data class OperationEntity(
    @PrimaryKey
    val id: String,
    val type: String, // "createReport", "startDay", "endDay", "submitReport", "addMedia", etc.
    val status: OperationStatus,
    val payload: String, // JSON string
    val dependsOn: List<String>, // Operation IDs this depends on
    val idempotencyKey: String,
    val attemptCount: Int = 0,
    val nextAttemptAt: Long? = null, // Timestamp
    val errorMessage: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

enum class OperationStatus {
    QUEUED,
    RUNNING,
    SUCCEEDED,
    FAILED_PERMANENT,
    DEFERRED // For background uploads
}
