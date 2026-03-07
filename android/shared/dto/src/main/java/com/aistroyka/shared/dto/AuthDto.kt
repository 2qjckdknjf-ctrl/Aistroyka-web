package com.aistroyka.shared.dto

import com.google.gson.annotations.SerializedName

/**
 * Auth DTOs matching backend contract
 */
data class LoginRequest(
    @SerializedName("email")
    val email: String,
    @SerializedName("password")
    val password: String
)

data class LoginResponse(
    @SerializedName("access_token")
    val accessToken: String,
    @SerializedName("token_type")
    val tokenType: String,
    @SerializedName("expires_in")
    val expiresIn: Int?,
    @SerializedName("refresh_token")
    val refreshToken: String?,
    @SerializedName("user")
    val user: AuthUser
)

data class AuthUser(
    @SerializedName("id")
    val id: String,
    @SerializedName("email")
    val email: String
)

data class ErrorResponse(
    @SerializedName("error")
    val error: String?,
    @SerializedName("code")
    val code: String?
)
