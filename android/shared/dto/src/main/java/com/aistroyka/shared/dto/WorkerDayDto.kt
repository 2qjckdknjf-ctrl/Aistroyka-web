package com.aistroyka.shared.dto

import com.google.gson.annotations.SerializedName

/**
 * WorkerDay DTO matching backend contract
 */
data class WorkerDayDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("tenant_id")
    val tenantId: String,
    @SerializedName("user_id")
    val userId: String,
    @SerializedName("day_date")
    val dayDate: String,
    @SerializedName("started_at")
    val startedAt: String?,
    @SerializedName("ended_at")
    val endedAt: String?
)

data class StartDayResponse(
    @SerializedName("data")
    val data: WorkerDayDto
)

data class EndDayResponse(
    @SerializedName("data")
    val data: WorkerDayDto
)
