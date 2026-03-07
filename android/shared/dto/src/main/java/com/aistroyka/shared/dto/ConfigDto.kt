package com.aistroyka.shared.dto

import com.google.gson.annotations.SerializedName

/**
 * Config DTO matching backend contract
 */
data class ConfigFlag(
    @SerializedName("enabled")
    val enabled: Boolean,
    @SerializedName("variant")
    val variant: String?
)

data class ConfigPayload(
    @SerializedName("flags")
    val flags: Map<String, ConfigFlag>,
    @SerializedName("limits")
    val limits: Map<String, Int>?,
    @SerializedName("serverTime")
    val serverTime: String,
    @SerializedName("traceId")
    val traceId: String,
    @SerializedName("clientProfile")
    val clientProfile: String
)
