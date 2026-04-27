package ai.aistroyka.shared

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Supabase password grant (same contract as iOS [AuthService]).
 */
object AuthService {
    private val http = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    suspend fun signIn(email: String, password: String) = withContext(Dispatchers.IO) {
        val base = AppRuntime.supabaseUrl
        if (base.isBlank()) {
            throw ApiError(null, null, "Supabase URL not configured. Set SUPABASE_URL in Worker build config.")
        }
        val url = "$base/auth/v1/token?grant_type=password"
        val bodyJson = JSONObject().put("email", email).put("password", password).toString()
        val req = Request.Builder()
            .url(url)
            .post(bodyJson.toRequestBody("application/json".toMediaType()))
            .header("apikey", AppRuntime.supabaseAnonKey)
            .header("Content-Type", "application/json")
            .build()
        val res = http.newCall(req).execute()
        val resBody = res.body?.string().orEmpty()
        if (!res.isSuccessful) {
            throw ApiError.fromHttp(res.code, resBody)
        }
        val json = JSONObject(resBody)
        val accessToken = json.getString("access_token")
        val user = json.getJSONObject("user")
        val uid = user.getString("id")
        SessionStore.saveSession(accessToken, uid)
    }

    suspend fun signOut() = withContext(Dispatchers.IO) {
        SessionStore.clear()
    }
}
