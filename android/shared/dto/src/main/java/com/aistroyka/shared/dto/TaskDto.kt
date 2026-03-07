package com.aistroyka.shared.dto

import com.google.gson.annotations.SerializedName

/**
 * Task DTO matching backend contract
 */
data class TaskDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("title")
    val title: String,
    @SerializedName("status")
    val status: String,
    @SerializedName("project_id")
    val projectId: String?,
    @SerializedName("assigned_to")
    val assignedTo: String?,
    @SerializedName("due_date")
    val dueDate: String?,
    @SerializedName("required_photos")
    val requiredPhotos: Map<String, Int>?,
    @SerializedName("report_required")
    val reportRequired: Boolean?,
    @SerializedName("report_id")
    val reportId: String?,
    @SerializedName("report_status")
    val reportStatus: String?,
    @SerializedName("created_at")
    val createdAt: String?
)

data class TasksListResponse(
    @SerializedName("data")
    val data: List<TaskDto>
)
