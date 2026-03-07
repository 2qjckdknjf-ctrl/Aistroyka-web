package com.aistroyka.shared.logging

import android.util.Log
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Centralized logging matching iOS logging patterns
 */
@Singleton
class Logger @Inject constructor() {
    
    fun d(tag: String, message: String, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.d(tag, message, throwable)
        } else {
            Log.d(tag, message)
        }
    }
    
    fun i(tag: String, message: String, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.i(tag, message, throwable)
        } else {
            Log.i(tag, message)
        }
    }
    
    fun w(tag: String, message: String, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.w(tag, message, throwable)
        } else {
            Log.w(tag, message)
        }
    }
    
    fun e(tag: String, message: String, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.e(tag, message, throwable)
        } else {
            Log.e(tag, message)
        }
    }
}
