package com.aistroyka.shared.api

import com.aistroyka.shared.dto.*
import retrofit2.Response
import retrofit2.http.*

/**
 * API client interface matching backend contracts
 * All endpoints mirror the backend API structure
 */
interface ApiClient {
    
    // ========== Auth ==========
    @POST("auth/v1/token?grant_type=password")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    // ========== Config ==========
    @GET("api/v1/config")
    suspend fun getConfig(@Header("Authorization") token: String): Response<ConfigPayload>
    
    // ========== Projects ==========
    @GET("api/v1/projects")
    suspend fun listProjects(
        @Header("Authorization") token: String,
        @Header("x-client") client: String
    ): Response<ProjectsListResponse>
    
    @POST("api/v1/projects")
    suspend fun createProject(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-idempotency-key") idempotencyKey: String,
        @Body request: CreateProjectRequest
    ): Response<CreateProjectResponse>
    
    // ========== Worker Tasks ==========
    @GET("api/v1/worker/tasks/today")
    suspend fun getTodayTasks(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Query("project_id") projectId: String?
    ): Response<TasksListResponse>
    
    // ========== Worker Day ==========
    @POST("api/v1/worker/day/start")
    suspend fun startDay(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-idempotency-key") idempotencyKey: String
    ): Response<StartDayResponse>
    
    @POST("api/v1/worker/day/end")
    suspend fun endDay(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-idempotency-key") idempotencyKey: String
    ): Response<EndDayResponse>
    
    // ========== Reports ==========
    @POST("api/v1/worker/report/create")
    suspend fun createReport(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-idempotency-key") idempotencyKey: String,
        @Body request: CreateReportRequest
    ): Response<CreateReportResponse>
    
    @POST("api/v1/worker/report/add-media")
    suspend fun addMediaToReport(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-idempotency-key") idempotencyKey: String,
        @Body request: AddMediaRequest
    ): Response<AddMediaResponse>
    
    @POST("api/v1/worker/report/submit")
    suspend fun submitReport(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-idempotency-key") idempotencyKey: String,
        @Body request: SubmitReportRequest
    ): Response<SubmitReportResponse>
    
    // ========== Sync ==========
    @GET("api/v1/sync/bootstrap")
    suspend fun syncBootstrap(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-device-id") deviceId: String
    ): Response<SyncBootstrapResponse>
    
    @GET("api/v1/sync/changes")
    suspend fun syncChanges(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-device-id") deviceId: String,
        @Query("cursor") cursor: Long,
        @Query("limit") limit: Int = 100
    ): Response<SyncChangesResponse>
    
    @POST("api/v1/sync/ack")
    suspend fun syncAck(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-device-id") deviceId: String,
        @Header("x-idempotency-key") idempotencyKey: String,
        @Body request: SyncAckRequest
    ): Response<SyncAckResponse>
    
    // ========== Media ==========
    @POST("api/v1/media/upload-sessions")
    suspend fun createUploadSession(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-idempotency-key") idempotencyKey: String,
        @Body request: CreateUploadSessionRequest
    ): Response<CreateUploadSessionResponse>
    
    @POST("api/v1/media/upload-sessions/{id}/finalize")
    suspend fun finalizeUploadSession(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-idempotency-key") idempotencyKey: String,
        @Path("id") sessionId: String
    ): Response<FinalizeUploadSessionResponse>
    
    // ========== AI ==========
    @POST("api/v1/ai/analyze-image")
    suspend fun analyzeImage(
        @Header("Authorization") token: String?,
        @Body request: AnalyzeImageRequest
    ): Response<AnalyzeImageResponse>
    
    // ========== Devices ==========
    @POST("api/v1/devices/register")
    suspend fun registerDevice(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-idempotency-key") idempotencyKey: String,
        @Body request: RegisterDeviceRequest
    ): Response<RegisterDeviceResponse>
    
    @POST("api/v1/devices/unregister")
    suspend fun unregisterDevice(
        @Header("Authorization") token: String,
        @Header("x-client") client: String,
        @Header("x-idempotency-key") idempotencyKey: String,
        @Body request: UnregisterDeviceRequest
    ): Response<UnregisterDeviceResponse>
}
