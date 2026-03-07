package com.aistroyka.shared.dto

import com.google.gson.annotations.SerializedName

/**
 * Device registration DTOs matching backend contract
 */
data class RegisterDeviceRequest(
    @SerializedName("device_id")
    val deviceId: String,
    @SerializedName("push_token")
    val pushToken: String,
    @SerializedName("platform")
    val platform: String, // "android"
    @SerializedName("app_version")
    val appVersion: String?
)

data class RegisterDeviceResponse(
    @SerializedName("success")
    val success: Boolean
)

data class UnregisterDeviceRequest(
    @SerializedName("device_id")
    val deviceId: String
)

data class UnregisterDeviceResponse(
    @SerializedName("success")
    val success: Boolean
)
