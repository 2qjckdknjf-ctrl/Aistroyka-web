package com.aistroyka.shared.dto

import com.google.gson.annotations.SerializedName

/**
 * Sync DTOs matching backend contract
 */
data class SyncBootstrapResponse(
    @SerializedName("data")
    val data: SyncBootstrapData,
    @SerializedName("cursor")
    val cursor: Long,
    @SerializedName("serverTime")
    val serverTime: String
)

data class SyncBootstrapData(
    @SerializedName("tasks")
    val tasks: List<SyncTaskDto>,
    @SerializedName("reports")
    val reports: List<SyncReportDto>,
    @SerializedName("uploadSessions")
    val uploadSessions: List<SyncUploadSessionDto>
)

data class SyncTaskDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("title")
    val title: String,
    @SerializedName("status")
    val status: String,
    @SerializedName("project_id")
    val projectId: String?,
    @SerializedName("due_date")
    val dueDate: String?,
    @SerializedName("created_at")
    val createdAt: String?
)

data class SyncReportDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("status")
    val status: String,
    @SerializedName("created_at")
    val createdAt: String?,
    @SerializedName("submitted_at")
    val submittedAt: String?
)

data class SyncUploadSessionDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("status")
    val status: String,
    @SerializedName("created_at")
    val createdAt: String?,
    @SerializedName("purpose")
    val purpose: String
)

data class SyncChangeEntry(
    @SerializedName("id")
    val id: Long,
    @SerializedName("tenant_id")
    val tenantId: String,
    @SerializedName("resource_type")
    val resourceType: String,
    @SerializedName("resource_id")
    val resourceId: String,
    @SerializedName("change_type")
    val changeType: String, // "created" | "updated" | "deleted"
    @SerializedName("changed_by")
    val changedBy: String?,
    @SerializedName("ts")
    val ts: String,
    @SerializedName("payload")
    val payload: Map<String, Any>
)

data class SyncChangesResponse(
    @SerializedName("data")
    val data: SyncChangesData,
    @SerializedName("nextCursor")
    val nextCursor: Long,
    @SerializedName("serverTime")
    val serverTime: String
)

data class SyncChangesData(
    @SerializedName("changes")
    val changes: List<SyncChangeEntry>
)

data class SyncAckRequest(
    @SerializedName("cursor")
    val cursor: Long
)

data class SyncAckResponse(
    @SerializedName("ok")
    val ok: Boolean,
    @SerializedName("cursor")
    val cursor: Long,
    @SerializedName("serverTime")
    val serverTime: String
)
