package ai.aistroyka.shared

/**
 * API and Supabase endpoints. Initialized by the Worker (or Manager) [android.app.Application].
 * Mirrors iOS [Config.baseURL] + `/api/v1` and Supabase keys from Info.plist / env.
 */
object AppRuntime {
    /** e.g. https://aistroyka.ai — no trailing slash. */
    var baseUrl: String = "https://www.aistroyka.ai"
        private set

    var supabaseUrl: String = ""
        private set

    var supabaseAnonKey: String = ""
        private set

    /**
     * `x-client` header. Worker: `android_lite` (lite allow-list). Manager: `android_manager` (full manager API).
     * Parity: iOS Worker `ios_lite`, iOS Manager `ios_manager`.
     */
    var apiClientProfile: String = "android_lite"

    /** Full prefix for v1 routes, e.g. https://aistroyka.ai/api/v1 */
    val apiV1Root: String
        get() = "${baseUrl.trimEnd('/')}/api/v1"

    fun init(baseUrl: String, supabaseUrl: String, supabaseAnonKey: String) {
        this.baseUrl = baseUrl.trimEnd('/')
        this.supabaseUrl = supabaseUrl.trimEnd('/')
        this.supabaseAnonKey = supabaseAnonKey
    }
}
