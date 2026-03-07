package com.aistroyka.shared.repository

import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.auth.TokenStorage
import com.aistroyka.shared.device.DeviceIdProvider
import com.aistroyka.shared.dto.*
import com.aistroyka.shared.error.ApiException
import com.aistroyka.shared.logging.Logger
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Sync service matching iOS SyncService
 * Implements cursor-based sync: bootstrap → changes → ack loop
 */
@Singleton
class SyncService @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage,
    private val deviceIdProvider: DeviceIdProvider,
    private val syncStorage: SyncStorage,
    private val logger: Logger
) {
    private val _syncState = MutableStateFlow<SyncState>(SyncState.Idle)
    val syncState: StateFlow<SyncState> = _syncState.asStateFlow()
    
    private val CLIENT_LITE = "android_lite"
    private val CLIENT_FULL = "android_full"
    
    suspend fun bootstrap(clientProfile: String = CLIENT_LITE): Result<SyncBootstrapResponse> {
        return try {
            _syncState.value = SyncState.Bootstrapping
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val deviceId = deviceIdProvider.getDeviceId()
            val client = if (clientProfile == "full") CLIENT_FULL else CLIENT_LITE
            
            val response = apiClient.syncBootstrap("Bearer $token", client, deviceId)
            if (response.isSuccessful && response.body() != null) {
                val bootstrap = response.body()!!
                syncStorage.saveCursor(bootstrap.cursor)
                _syncState.value = SyncState.Idle
                logger.i("SyncService", "Bootstrap successful, cursor: ${bootstrap.cursor}")
                Result.success(bootstrap)
            } else {
                _syncState.value = SyncState.Error("Bootstrap failed")
                Result.failure(Exception("Bootstrap failed"))
            }
        } catch (e: ApiException) {
            if (e.error is ApiError.Conflict) {
                // Must bootstrap
                _syncState.value = SyncState.MustBootstrap
            } else {
                _syncState.value = SyncState.Error(e.error.message)
            }
            Result.failure(e)
        } catch (e: Exception) {
            _syncState.value = SyncState.Error(e.message ?: "Unknown error")
            Result.failure(e)
        }
    }
    
    suspend fun fetchChanges(clientProfile: String = CLIENT_LITE, limit: Int = 100): Result<SyncChangesResponse> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val deviceId = deviceIdProvider.getDeviceId()
            val client = if (clientProfile == "full") CLIENT_FULL else CLIENT_LITE
            val cursor = syncStorage.getCursor() ?: return Result.failure(Exception("No cursor, must bootstrap"))
            
            val response = apiClient.syncChanges("Bearer $token", client, deviceId, cursor, limit)
            if (response.isSuccessful && response.body() != null) {
                val changes = response.body()!!
                Result.success(changes)
            } else {
                Result.failure(Exception("Failed to fetch changes"))
            }
        } catch (e: ApiException) {
            if (e.error is ApiError.Conflict) {
                _syncState.value = SyncState.MustBootstrap
            }
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun ack(cursor: Long, clientProfile: String = CLIENT_LITE): Result<SyncAckResponse> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val deviceId = deviceIdProvider.getDeviceId()
            val client = if (clientProfile == "full") CLIENT_FULL else CLIENT_LITE
            val idempotencyKey = java.util.UUID.randomUUID().toString()
            
            val request = SyncAckRequest(cursor)
            val response = apiClient.syncAck("Bearer $token", client, deviceId, idempotencyKey, request)
            if (response.isSuccessful && response.body() != null) {
                val ack = response.body()!!
                syncStorage.saveCursor(ack.cursor)
                logger.i("SyncService", "Ack successful, cursor: ${ack.cursor}")
                Result.success(ack)
            } else {
                Result.failure(Exception("Ack failed"))
            }
        } catch (e: ApiException) {
            if (e.error is ApiError.Conflict) {
                _syncState.value = SyncState.MustBootstrap
            }
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun getCursor(): Long? {
        return syncStorage.getCursor()
    }
}

sealed class SyncState {
    object Idle : SyncState()
    object Bootstrapping : SyncState()
    object MustBootstrap : SyncState()
    data class Error(val message: String) : SyncState()
}
