package com.aistroyka.shared.error

import com.aistroyka.shared.dto.ErrorResponse
import com.google.gson.Gson
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApiErrorHandler @Inject constructor(
    private val gson: Gson
) : Interceptor {
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response = try {
            chain.proceed(request)
        } catch (e: IOException) {
            throw ApiException(ApiError.NetworkError("Network error: ${e.message}"))
        }
        
        if (!response.isSuccessful) {
            val errorBody = response.body?.string()
            val errorResponse = try {
                if (errorBody != null) {
                    gson.fromJson(errorBody, ErrorResponse::class.java)
                } else {
                    null
                }
            } catch (e: Exception) {
                null
            }
            
            val error = when (response.code) {
                400 -> ApiError.BadRequest(
                    errorResponse?.error ?: "Bad request",
                    errorResponse?.code
                )
                401 -> ApiError.Unauthorized(
                    errorResponse?.error ?: "Unauthorized"
                )
                402 -> ApiError.PaymentRequired(
                    errorResponse?.error ?: "Payment required"
                )
                403 -> ApiError.Forbidden(
                    errorResponse?.error ?: "Forbidden",
                    errorResponse?.code
                )
                404 -> ApiError.NotFound(
                    errorResponse?.error ?: "Not found"
                )
                409 -> ApiError.Conflict(
                    errorResponse?.error ?: "Conflict",
                    errorResponse?.code
                )
                413 -> ApiError.PayloadTooLarge(
                    errorResponse?.error ?: "Payload too large"
                )
                429 -> ApiError.RateLimited(
                    errorResponse?.error ?: "Rate limited"
                )
                500 -> ApiError.ServerError(
                    errorResponse?.error ?: "Server error"
                )
                else -> ApiError.UnknownError(
                    errorResponse?.error ?: "Unknown error (${response.code})"
                )
            }
            
            throw ApiException(error)
        }
        
        return response
    }
}

class ApiException(val error: ApiError) : Exception(error.message)
