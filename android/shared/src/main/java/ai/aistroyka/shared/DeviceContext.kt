package ai.aistroyka.shared

import android.content.Context
import java.util.UUID

/**
 * Stable device id and idempotency keys (parity with iOS [DeviceContext]).
 */
object DeviceContext {
    private const val PREFS = "aistroyka_device"
    private const val KEY_DEVICE_ID = "device_id"

    private lateinit var appContext: Context

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    val deviceId: String
        get() {
            val c = appContext
            val p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val existing = p.getString(KEY_DEVICE_ID, null)
            if (existing != null) return existing
            val id = UUID.randomUUID().toString()
            p.edit().putString(KEY_DEVICE_ID, id).apply()
            return id
        }

    fun newIdempotencyKey(): String = UUID.randomUUID().toString()
}
