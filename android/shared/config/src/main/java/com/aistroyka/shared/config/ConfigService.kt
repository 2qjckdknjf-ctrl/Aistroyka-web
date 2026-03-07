package com.aistroyka.shared.config

import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.auth.TokenStorage
import com.aistroyka.shared.dto.ConfigPayload
import com.aistroyka.shared.error.ApiException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Config service matching backend config endpoint
 */
@Singleton
class ConfigService @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage
) {
    private val _config = MutableStateFlow<ConfigPayload?>(null)
    val config: StateFlow<ConfigPayload?> = _config.asStateFlow()
    
    suspend fun fetchConfig(): Result<ConfigPayload> {
        return try {
            val token = tokenStorage.getToken()
            if (token == null) {
                return Result.failure(Exception("Not authenticated"))
            }
            
            val response = apiClient.getConfig("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                val config = response.body()!!
                _config.value = config
                Result.success(config)
            } else {
                Result.failure(Exception("Failed to fetch config"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun isFlagEnabled(flagName: String): Boolean {
        return _config.value?.flags?.get(flagName)?.enabled ?: false
    }
    
    fun getClientProfile(): String? {
        return _config.value?.clientProfile
    }
}
