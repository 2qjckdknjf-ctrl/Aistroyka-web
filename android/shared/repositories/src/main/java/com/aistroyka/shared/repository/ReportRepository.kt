package com.aistroyka.shared.repository

import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.auth.TokenStorage
import com.aistroyka.shared.device.IdempotencyKeyGenerator
import com.aistroyka.shared.dto.*
import com.aistroyka.shared.error.ApiException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReportRepository @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage,
    private val idempotencyKeyGenerator: IdempotencyKeyGenerator
) {
    private val CLIENT_LITE = "android_lite"
    
    suspend fun createReport(dayId: String? = null, taskId: String? = null): Result<ReportDto> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val idempotencyKey = idempotencyKeyGenerator.generate()
            
            val request = CreateReportRequest(dayId, taskId)
            val response = apiClient.createReport("Bearer $token", CLIENT_LITE, idempotencyKey, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data)
            } else {
                Result.failure(Exception("Failed to create report"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun addMedia(
        reportId: String,
        uploadSessionId: String,
        purpose: String
    ): Result<ReportDto> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val idempotencyKey = idempotencyKeyGenerator.generate()
            
            val request = AddMediaRequest(reportId, uploadSessionId, purpose)
            val response = apiClient.addMediaToReport("Bearer $token", CLIENT_LITE, idempotencyKey, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data)
            } else {
                Result.failure(Exception("Failed to add media"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun submitReport(reportId: String): Result<ReportDto> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val idempotencyKey = idempotencyKeyGenerator.generate()
            
            val request = SubmitReportRequest(reportId)
            val response = apiClient.submitReport("Bearer $token", CLIENT_LITE, idempotencyKey, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data)
            } else {
                Result.failure(Exception("Failed to submit report"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
