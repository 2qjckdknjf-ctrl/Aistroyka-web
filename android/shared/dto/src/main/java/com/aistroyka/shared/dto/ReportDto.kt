package com.aistroyka.shared.dto

import com.google.gson.annotations.SerializedName

/**
 * Report DTO matching backend contract
 */
data class ReportDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("tenant_id")
    val tenantId: String,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("day_id")
    val dayId: String?,
    @SerializedName("task_id")
    val taskId: String?,
    @SerializedName("status")
    val status: String,
    @SerializedName("created_at")
    val createdAt: String?,
    @SerializedName("submitted_at")
    val submittedAt: String?
)

data class CreateReportRequest(
    @SerializedName("day_id")
    val dayId: String?,
    @SerializedName("task_id")
    val taskId: String?
)

data class CreateReportResponse(
    @SerializedName("data")
    val data: ReportDto
)

data class AddMediaRequest(
    @SerializedName("report_id")
    val reportId: String,
    @SerializedName("upload_session_id")
    val uploadSessionId: String,
    @SerializedName("purpose")
    val purpose: String // "report_before" | "report_after" | "project_media"
)

data class AddMediaResponse(
    @SerializedName("data")
    val data: ReportDto
)

data class SubmitReportRequest(
    @SerializedName("report_id")
    val reportId: String
)

data class SubmitReportResponse(
    @SerializedName("data")
    val data: ReportDto
)
