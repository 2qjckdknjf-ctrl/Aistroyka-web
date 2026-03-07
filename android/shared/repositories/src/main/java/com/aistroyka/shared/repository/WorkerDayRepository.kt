package com.aistroyka.shared.repository

import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.auth.TokenStorage
import com.aistroyka.shared.device.IdempotencyKeyGenerator
import com.aistroyka.shared.dto.*
import com.aistroyka.shared.error.ApiException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WorkerDayRepository @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage,
    private val idempotencyKeyGenerator: IdempotencyKeyGenerator
) {
    private val CLIENT_LITE = "android_lite"
    
    suspend fun startDay(): Result<WorkerDayDto> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val idempotencyKey = idempotencyKeyGenerator.generate()
            
            val response = apiClient.startDay("Bearer $token", CLIENT_LITE, idempotencyKey)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data)
            } else {
                Result.failure(Exception("Failed to start day"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun endDay(): Result<WorkerDayDto> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val idempotencyKey = idempotencyKeyGenerator.generate()
            
            val response = apiClient.endDay("Bearer $token", CLIENT_LITE, idempotencyKey)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data)
            } else {
                Result.failure(Exception("Failed to end day"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
