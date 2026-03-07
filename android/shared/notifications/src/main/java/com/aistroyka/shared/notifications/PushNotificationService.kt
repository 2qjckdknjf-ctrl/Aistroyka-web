package com.aistroyka.shared.notifications

import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.auth.TokenStorage
import com.aistroyka.shared.device.DeviceIdProvider
import com.aistroyka.shared.device.IdempotencyKeyGenerator
import com.aistroyka.shared.dto.*
import com.aistroyka.shared.error.ApiException
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Push notification service matching iOS PushRegistrationService
 */
@Singleton
class PushNotificationService @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage,
    private val deviceIdProvider: DeviceIdProvider,
    private val idempotencyKeyGenerator: IdempotencyKeyGenerator
) {
    private val CLIENT_LITE = "android_lite"
    private val CLIENT_FULL = "android_full"
    
    suspend fun registerPushToken(
        pushToken: String,
        appVersion: String? = null,
        clientProfile: String = "lite"
    ): Result<Boolean> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val deviceId = deviceIdProvider.getDeviceId()
            val client = if (clientProfile == "full") CLIENT_FULL else CLIENT_LITE
            val idempotencyKey = idempotencyKeyGenerator.generate()
            
            val request = RegisterDeviceRequest(deviceId, pushToken, "android", appVersion)
            val response = apiClient.registerDevice("Bearer $token", client, idempotencyKey, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.success)
            } else {
                Result.failure(Exception("Failed to register device"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun unregisterPushToken(clientProfile: String = "lite"): Result<Boolean> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val deviceId = deviceIdProvider.getDeviceId()
            val client = if (clientProfile == "full") CLIENT_FULL else CLIENT_LITE
            val idempotencyKey = idempotencyKeyGenerator.generate()
            
            val request = UnregisterDeviceRequest(deviceId)
            val response = apiClient.unregisterDevice("Bearer $token", client, idempotencyKey, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.success)
            } else {
                Result.failure(Exception("Failed to unregister device"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
