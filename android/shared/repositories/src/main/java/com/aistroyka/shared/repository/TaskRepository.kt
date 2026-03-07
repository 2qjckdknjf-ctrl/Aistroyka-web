package com.aistroyka.shared.repository

import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.auth.TokenStorage
import com.aistroyka.shared.dto.TaskDto
import com.aistroyka.shared.dto.TasksListResponse
import com.aistroyka.shared.error.ApiException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TaskRepository @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage
) {
    private val CLIENT_LITE = "android_lite"
    private val CLIENT_FULL = "android_full"
    
    suspend fun getTodayTasks(
        projectId: String? = null,
        clientProfile: String = "lite"
    ): Result<List<TaskDto>> {
        return try {
            val token = tokenStorage.getToken() ?: return Result.failure(Exception("Not authenticated"))
            val client = if (clientProfile == "full") CLIENT_FULL else CLIENT_LITE
            
            val response = apiClient.getTodayTasks("Bearer $token", client, projectId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data)
            } else {
                Result.failure(Exception("Failed to fetch tasks"))
            }
        } catch (e: ApiException) {
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
