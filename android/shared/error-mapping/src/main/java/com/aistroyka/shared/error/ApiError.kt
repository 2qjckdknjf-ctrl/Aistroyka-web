package com.aistroyka.shared.error

/**
 * API error types matching backend error codes
 */
sealed class ApiError(
    val message: String,
    val code: String? = null,
    val statusCode: Int? = null
) {
    data class BadRequest(override val message: String, override val code: String?) : ApiError(message, code, 400)
    data class Unauthorized(override val message: String) : ApiError(message, null, 401)
    data class PaymentRequired(override val message: String) : ApiError(message, null, 402)
    data class Forbidden(override val message: String, override val code: String?) : ApiError(message, code, 403)
    data class NotFound(override val message: String) : ApiError(message, null, 404)
    data class Conflict(override val message: String, override val code: String?) : ApiError(message, code, 409)
    data class PayloadTooLarge(override val message: String) : ApiError(message, null, 413)
    data class RateLimited(override val message: String) : ApiError(message, null, 429)
    data class ServerError(override val message: String) : ApiError(message, null, 500)
    data class NetworkError(override val message: String) : ApiError(message)
    data class UnknownError(override val message: String) : ApiError(message)
}
