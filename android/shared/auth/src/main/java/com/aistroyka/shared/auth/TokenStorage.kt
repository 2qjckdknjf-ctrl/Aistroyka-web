package com.aistroyka.shared.auth

import android.content.Context
import android.content.SharedPreferences
import com.aistroyka.shared.dto.AuthUser
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenStorage @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gson: Gson
) {
    private val prefs: SharedPreferences = 
        context.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
    
    private val KEY_TOKEN = "access_token"
    private val KEY_REFRESH_TOKEN = "refresh_token"
    private val KEY_USER = "user"
    
    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }
    
    fun getToken(): String? {
        return prefs.getString(KEY_TOKEN, null)
    }
    
    fun saveRefreshToken(token: String?) {
        if (token != null) {
            prefs.edit().putString(KEY_REFRESH_TOKEN, token).apply()
        }
    }
    
    fun getRefreshToken(): String? {
        return prefs.getString(KEY_REFRESH_TOKEN, null)
    }
    
    fun saveUser(user: AuthUser) {
        val userJson = gson.toJson(user)
        prefs.edit().putString(KEY_USER, userJson).apply()
    }
    
    fun getUser(): AuthUser? {
        val userJson = prefs.getString(KEY_USER, null)
        return if (userJson != null) {
            try {
                gson.fromJson(userJson, AuthUser::class.java)
            } catch (e: Exception) {
                null
            }
        } else {
            null
        }
    }
    
    fun clear() {
        prefs.edit().clear().apply()
    }
}
