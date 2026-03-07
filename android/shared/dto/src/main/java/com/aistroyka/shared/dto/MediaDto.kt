package com.aistroyka.shared.dto

import com.google.gson.annotations.SerializedName

/**
 * Media/Upload Session DTOs matching backend contract
 */
data class CreateUploadSessionRequest(
    @SerializedName("purpose")
    val purpose: String, // "report_before" | "report_after" | "project_media"
    @SerializedName("report_id")
    val reportId: String?
)

data class CreateUploadSessionResponse(
    @SerializedName("data")
    val data: UploadSessionDto
)

data class UploadSessionDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("upload_path")
    val uploadPath: String,
    @SerializedName("purpose")
    val purpose: String,
    @SerializedName("status")
    val status: String,
    @SerializedName("created_at")
    val createdAt: String?
)

data class FinalizeUploadSessionRequest(
    @SerializedName("session_id")
    val sessionId: String
)

data class FinalizeUploadSessionResponse(
    @SerializedName("data")
    val data: UploadSessionDto
)
