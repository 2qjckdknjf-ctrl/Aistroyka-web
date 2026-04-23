package ai.aistroyka.shared

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Persists Supabase access token and user id (parity with iOS Keychain session keys).
 */
object SessionStore {
    private const val PREFS = "aistroyka_session_enc"
    private const val KEY_TOKEN = "access_token"
    private const val KEY_USER_ID = "user_id"

    private lateinit var prefs: android.content.SharedPreferences

    fun init(context: Context) {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context,
            PREFS,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun getAccessToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)

    fun saveSession(accessToken: String, userId: String) {
        prefs.edit()
            .putString(KEY_TOKEN, accessToken)
            .putString(KEY_USER_ID, userId)
            .apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    fun hasSession(): Boolean = !getAccessToken().isNullOrBlank()
}
