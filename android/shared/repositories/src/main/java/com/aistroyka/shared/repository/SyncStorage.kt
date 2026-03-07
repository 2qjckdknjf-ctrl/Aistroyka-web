package com.aistroyka.shared.repository

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncStorage @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs: SharedPreferences = 
        context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
    
    private val KEY_CURSOR = "sync_cursor"
    
    fun saveCursor(cursor: Long) {
        prefs.edit().putLong(KEY_CURSOR, cursor).apply()
    }
    
    fun getCursor(): Long? {
        val cursor = prefs.getLong(KEY_CURSOR, -1L)
        return if (cursor >= 0) cursor else null
    }
    
    fun clearCursor() {
        prefs.edit().remove(KEY_CURSOR).apply()
    }
}
