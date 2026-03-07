package com.aistroyka.shared.repository

import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.auth.TokenStorage
import com.aistroyka.shared.device.IdempotencyKeyGenerator
import com.aistroyka.shared.dto.*
import com.aistroyka.shared.error.ApiException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProjectRepository @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage,
    private val idempotencyKeyGenerator: IdempotencyKeyGenerator
) {
    private val CLIENT_FULL = "android_full"
    
    suspend fun listProjects(): Result<List<ProjectDto>> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            
            val response = apiClient.listProjects("Bearer $token", CLIENT_FULL)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data)
            } else {
                Result.failure(Exception("Failed to fetch projects"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createProject(name: String): Result<ProjectDto> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val idempotencyKey = idempotencyKeyGenerator.generate()
            
            val request = CreateProjectRequest(name)
            val response = apiClient.createProject("Bearer $token", CLIENT_FULL, idempotencyKey, request)
            if (response.isSuccessful && response.body() != null) {
                val projectId = response.body()!!.data.id
                // Fetch full project details if needed
                Result.success(ProjectDto(projectId, name, null))
            } else {
                Result.failure(Exception("Failed to create project"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
