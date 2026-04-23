package ai.aistroyka.worker

import android.app.Application
import ai.aistroyka.shared.AppRuntime
import ai.aistroyka.shared.DeviceContext
import ai.aistroyka.shared.SessionStore

class WorkerApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        AppRuntime.init(
            baseUrl = BuildConfig.BASE_URL,
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY
        )
        AppRuntime.apiClientProfile = "android_lite"
        DeviceContext.init(this)
        SessionStore.init(this)
    }
}
