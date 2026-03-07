package com.aistroyka.shared.repository.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "app_state")
data class AppStateEntity(
    @PrimaryKey
    val id: String = "singleton",
    val dayId: String? = null,
    val shiftStartedAt: String? = null,
    val shiftEndedAt: String? = null,
    val draftReportId: String? = null,
    val draftTaskId: String? = null,
    val lastSyncCursor: Long? = null,
    val selectedProjectId: String? = null
)
