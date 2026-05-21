package ai.aistroyka.shared

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Persists FCM / push token (encrypted) and registers with [WorkerApi.registerDevice] when session exists.
 * Parity with iOS [PushRegistrationService]. Token must never be logged or shown in UI.
 */
object PushRegistrationService {
    private const val PREFS = "aistroyka_push_enc"
    private const val KEY_TOKEN = "push_token"

    private lateinit var prefs: android.content.SharedPreferences
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun init(context: Context) {
        val masterKey = MasterKey.Builder(context.applicationContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context.applicationContext,
            PREFS,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun saveToken(token: String) {
        if (!::prefs.isInitialized) return
        prefs.edit().putString(KEY_TOKEN, token.trim()).apply()
    }

    fun getToken(): String? {
        if (!::prefs.isInitialized) return null
        return prefs.getString(KEY_TOKEN, null)?.trim()?.takeIf { it.isNotEmpty() }
    }

    /**
     * Fire-and-forget: POST /api/v1/devices/register when both token and auth exist (retries on next call).
     */
    fun registerIfNeeded() {
        scope.launch {
            val token = getToken() ?: return@launch
            if (!SessionStore.hasSession()) return@launch
            try {
                WorkerApi.registerDevice(token)
            } catch (ignored: Exception) {
                // Silent; retry on next launch / login / token refresh (same as iOS)
            }
        }
    }
}
