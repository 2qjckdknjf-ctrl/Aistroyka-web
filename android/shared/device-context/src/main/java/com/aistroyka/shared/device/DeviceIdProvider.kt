package com.aistroyka.shared.device

import android.content.Context
import android.provider.Settings
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Device ID provider matching iOS device-id generation
 * Uses Android ID or generates a persistent UUID
 */
@Singleton
class DeviceIdProvider @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs = context.getSharedPreferences("device_prefs", Context.MODE_PRIVATE)
    private val KEY_DEVICE_ID = "device_id"
    
    fun getDeviceId(): String {
        val storedId = prefs.getString(KEY_DEVICE_ID, null)
        if (storedId != null) {
            return storedId
        }
        
        // Try Android ID first
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        if (androidId != null && androidId.isNotEmpty() && androidId != "9774d56d682e549c") {
            // Valid Android ID (not the emulator default)
            prefs.edit().putString(KEY_DEVICE_ID, androidId).apply()
            return androidId
        }
        
        // Generate and store UUID
        val uuid = UUID.randomUUID().toString()
        prefs.edit().putString(KEY_DEVICE_ID, uuid).apply()
        return uuid
    }
}
