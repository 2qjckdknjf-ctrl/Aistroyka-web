package com.aistroyka.shared.auth

import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.dto.LoginRequest
import com.aistroyka.shared.dto.LoginResponse
import com.aistroyka.shared.error.ApiException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Authentication service matching iOS AuthService
 * Uses Supabase Auth via REST API
 */
@Singleton
class AuthService @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage
) {
    
    private val _authState = MutableStateFlow<AuthState>(AuthState.Unauthenticated)
    val authState: Flow<AuthState> = _authState.asStateFlow()
    
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val request = LoginRequest(email, password)
            val response = apiClient.login(request)
            
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                tokenStorage.saveToken(loginResponse.accessToken)
                tokenStorage.saveRefreshToken(loginResponse.refreshToken)
                tokenStorage.saveUser(loginResponse.user)
                
                _authState.value = AuthState.Authenticated(loginResponse.user)
                Result.success(loginResponse)
            } else {
                Result.failure(Exception("Login failed"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun logout() {
        tokenStorage.clear()
        _authState.value = AuthState.Unauthenticated
    }
    
    fun getToken(): String? {
        return tokenStorage.getToken()
    }
    
    fun getCurrentUser() = tokenStorage.getUser()
    
    suspend fun refreshAuthState() {
        val token = tokenStorage.getToken()
        val user = tokenStorage.getUser()
        if (token != null && user != null) {
            _authState.value = AuthState.Authenticated(user)
        } else {
            _authState.value = AuthState.Unauthenticated
        }
    }
}

sealed class AuthState {
    object Unauthenticated : AuthState()
    data class Authenticated(val user: com.aistroyka.shared.dto.AuthUser) : AuthState()
}
