package ai.aistroyka.shared

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * HTTP client for app API v1 routes (parity with iOS APIClient: Bearer, x-device-id, x-client, idempotency).
 */
object ApiClient {
    internal const val CLIENT_PROFILE = "android_worker"

    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    internal val http = OkHttpClient.Builder()
        .connectTimeout(45, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(120, TimeUnit.SECONDS)
        // Some API 29/30 emulators stall on HTTP/2 to Vercel; force HTTP/1.1 for reliable pilot runs.
        .protocols(listOf(Protocol.HTTP_1_1))
        .build()

    internal suspend inline fun <reified T : Any> request(
        path: String,
        method: String = "GET",
        jsonBody: String? = null,
        idempotencyKey: String? = null,
    ): T = withContext(Dispatchers.IO) {
        val root = AppRuntime.apiV1Root
        val trimmed = path.trimStart('/')
        val url = "$root/$trimmed"
        val token = SessionStore.getAccessToken()
        val builder = Request.Builder()
            .url(url)
            .method(method, jsonBody?.toRequestBody("application/json".toMediaType()))
            .header("x-device-id", DeviceContext.deviceId)
            .header("x-client", AppRuntime.apiClientProfile)
        if (!token.isNullOrBlank()) {
            builder.header("Authorization", "Bearer $token")
        }
        if (jsonBody != null) {
            builder.header("Content-Type", "application/json")
        }
        if (idempotencyKey != null) {
            builder.header("x-idempotency-key", idempotencyKey)
        }
        val res = http.newCall(builder.build()).execute()
        val bodyStr = res.body?.string().orEmpty()
        if (!res.isSuccessful) {
            throw ApiError.fromHttp(res.code, bodyStr)
        }
        json.decodeFromString<T>(bodyStr)
    }

    internal suspend fun requestVoid(
        path: String,
        method: String = "POST",
        jsonBody: String? = null,
        idempotencyKey: String? = null,
    ) = withContext(Dispatchers.IO) {
        val root = AppRuntime.apiV1Root
        val trimmed = path.trimStart('/')
        val url = "$root/$trimmed"
        val token = SessionStore.getAccessToken()
        val builder = Request.Builder()
            .url(url)
            .method(method, jsonBody?.toRequestBody("application/json".toMediaType()))
            .header("x-device-id", DeviceContext.deviceId)
            .header("x-client", AppRuntime.apiClientProfile)
        if (!token.isNullOrBlank()) {
            builder.header("Authorization", "Bearer $token")
        }
        if (jsonBody != null) {
            builder.header("Content-Type", "application/json")
        }
        if (idempotencyKey != null) {
            builder.header("x-idempotency-key", idempotencyKey)
        }
        val res = http.newCall(builder.build()).execute()
        val bodyStr = res.body?.string().orEmpty()
        if (!res.isSuccessful) {
            throw ApiError.fromHttp(res.code, bodyStr)
        }
    }

    internal suspend fun requestDataAndStatus(
        path: String,
        method: String = "GET",
        jsonBody: String? = null,
    ): Pair<String, Int> = withContext(Dispatchers.IO) {
        val root = AppRuntime.apiV1Root
        val trimmed = path.trimStart('/')
        val url = "$root/$trimmed"
        val token = SessionStore.getAccessToken()
        val builder = Request.Builder()
            .url(url)
            .method(method, jsonBody?.toRequestBody("application/json".toMediaType()))
            .header("x-device-id", DeviceContext.deviceId)
            .header("x-client", AppRuntime.apiClientProfile)
        if (!token.isNullOrBlank()) {
            builder.header("Authorization", "Bearer $token")
        }
        if (jsonBody != null) {
            builder.header("Content-Type", "application/json")
        }
        val res = http.newCall(builder.build()).execute()
        val bodyStr = res.body?.string().orEmpty()
        bodyStr to res.code
    }
}
