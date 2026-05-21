package ai.aistroyka.shared

import android.content.Context
import java.security.MessageDigest
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

    /**
     * Stable idempotency key for `POST /api/v1/devices/register` (same device + push token → same key for safe retries).
     * Matches iOS [DeviceContext.idempotencyKeyDeviceRegister]: SHA-256 of `deviceId + RS + token`, prefix `device-register-`.
     */
    fun idempotencyKeyDeviceRegister(pushToken: String): String {
        val material = "${deviceId}\u001E$pushToken"
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(material.toByteArray(Charsets.UTF_8))
        val hex = digest.joinToString("") { b -> "%02x".format(b) }
        return "device-register-$hex"
    }

    /** Same scheme as iOS [DeviceContext.idempotencyKeyDeviceUnregister]. */
    fun idempotencyKeyDeviceUnregister(): String {
        val material = "${deviceId}\u001Edevice-unregister"
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(material.toByteArray(Charsets.UTF_8))
        val hex = digest.joinToString("") { b -> "%02x".format(b) }
        return "device-unregister-$hex"
    }
}
