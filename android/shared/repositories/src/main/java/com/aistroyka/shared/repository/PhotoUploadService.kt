package com.aistroyka.shared.repository

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.aistroyka.shared.api.ApiClient
import com.aistroyka.shared.auth.TokenStorage
import com.aistroyka.shared.device.IdempotencyKeyGenerator
import com.aistroyka.shared.dto.*
import com.aistroyka.shared.error.ApiException
import com.aistroyka.shared.logging.Logger
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.ByteArrayOutputStream
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Photo upload service matching iOS UploadManager
 * Handles photo capture, compression, and upload flow
 */
@Singleton
class PhotoUploadService @Inject constructor(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage,
    private val idempotencyKeyGenerator: IdempotencyKeyGenerator,
    private val logger: Logger
) {
    data class PhotoUploadItem(
        val id: String = UUID.randomUUID().toString(),
        val purpose: String, // "report_before" | "report_after"
        var phase: UploadPhase = UploadPhase.QUEUED,
        var sessionId: String? = null,
        var uploadPath: String? = null,
        var error: String? = null,
        val idempotencyKeyCreate: String = idempotencyKeyGenerator.generate(),
        val idempotencyKeyFinalize: String = idempotencyKeyGenerator.generate(),
        val idempotencyKeyAddMedia: String = idempotencyKeyGenerator.generate()
    )
    
    enum class UploadPhase {
        QUEUED,
        CREATING_SESSION,
        UPLOADING,
        FINALIZING,
        ATTACHING,
        DONE,
        FAILED
    }
    
    private val _uploadItems = MutableStateFlow<List<PhotoUploadItem>>(emptyList())
    val uploadItems: StateFlow<List<PhotoUploadItem>> = _uploadItems.asStateFlow()
    
    private val CLIENT_LITE = "android_lite"
    
    fun enqueuePhoto(purpose: String): PhotoUploadItem {
        val item = PhotoUploadItem(purpose = purpose)
        _uploadItems.value = _uploadItems.value + item
        return item
    }
    
    suspend fun uploadPhoto(
        bitmap: Bitmap,
        itemId: String,
        reportId: String
    ) {
        val itemIndex = _uploadItems.value.indexOfFirst { it.id == itemId }
        if (itemIndex == -1) {
            logger.w("PhotoUploadService", "Item not found: $itemId")
            return
        }
        
        val item = _uploadItems.value[itemIndex]
        
        try {
            // Compress image (JPEG quality 0.85, matching iOS)
            val compressed = compressBitmap(bitmap, quality = 0.85f)
            val size = compressed.size
            
            // Update phase: creating session
            updateItem(itemIndex) { it.phase = UploadPhase.CREATING_SESSION }
            
            // Create upload session
            val token = tokenStorage.getToken() ?: throw Exception("Not authenticated")
            val sessionRequest = CreateUploadSessionRequest(item.purpose, reportId)
            val sessionResponse = apiClient.createUploadSession(
                "Bearer $token",
                CLIENT_LITE,
                item.idempotencyKeyCreate,
                sessionRequest
            )
            
            if (!sessionResponse.isSuccessful || sessionResponse.body() == null) {
                throw Exception("Failed to create upload session")
            }
            
            val session = sessionResponse.body()!!.data
            updateItem(itemIndex) {
                it.sessionId = session.id
                it.uploadPath = session.uploadPath
                it.phase = UploadPhase.UPLOADING
            }
            
            // Upload to Supabase storage
            // Note: This requires Supabase storage URL and anon key
            // For now, we'll mark as uploading and let WorkManager handle the actual upload
            // TODO: Implement Supabase storage upload
            
            // Finalize session
            updateItem(itemIndex) { it.phase = UploadPhase.FINALIZING }
            
            val finalizeResponse = apiClient.finalizeUploadSession(
                "Bearer $token",
                CLIENT_LITE,
                item.idempotencyKeyFinalize,
                session.id
            )
            
            if (!finalizeResponse.isSuccessful) {
                throw Exception("Failed to finalize upload session")
            }
            
            // Attach media to report
            updateItem(itemIndex) { it.phase = UploadPhase.ATTACHING }
            
            val addMediaRequest = AddMediaRequest(reportId, session.id, item.purpose)
            val addMediaResponse = apiClient.addMediaToReport(
                "Bearer $token",
                CLIENT_LITE,
                item.idempotencyKeyAddMedia,
                addMediaRequest
            )
            
            if (!addMediaResponse.isSuccessful) {
                throw Exception("Failed to add media to report")
            }
            
            // Success
            updateItem(itemIndex) { it.phase = UploadPhase.DONE }
            
        } catch (e: Exception) {
            logger.e("PhotoUploadService", "Upload failed for item $itemId", e)
            updateItem(itemIndex) {
                it.phase = UploadPhase.FAILED
                it.error = e.message ?: "Upload failed"
            }
        }
    }
    
    private fun compressBitmap(bitmap: Bitmap, quality: Float): ByteArray {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, (quality * 100).toInt(), stream)
        return stream.toByteArray()
    }
    
    private fun updateItem(index: Int, update: (PhotoUploadItem) -> PhotoUploadItem) {
        val current = _uploadItems.value.toMutableList()
        current[index] = update(current[index])
        _uploadItems.value = current
    }
    
    fun retryUpload(itemId: String, bitmap: Bitmap, reportId: String) {
        val itemIndex = _uploadItems.value.indexOfFirst { it.id == itemId }
        if (itemIndex != -1) {
            updateItem(itemIndex) {
                it.phase = UploadPhase.QUEUED
                it.error = null
            }
            // Re-upload
            // Note: This should be called from a coroutine scope
        }
    }
    
    fun removeItem(itemId: String) {
        _uploadItems.value = _uploadItems.value.filter { it.id != itemId }
    }
}
