package ai.aistroyka.shared

import org.json.JSONObject

class ApiError(
    val statusCode: Int?,
    val code: String?,
    override val message: String
) : Exception(message) {
    val isUnauthorized: Boolean get() = statusCode == 401
    val isForbidden: Boolean get() = statusCode == 403

    companion object {
        fun fromHttp(statusCode: Int, body: String?): ApiError {
            var msg = "Request failed"
            var apiCode: String? = null
            if (!body.isNullOrBlank()) {
                try {
                    val json = JSONObject(body)
                    msg = json.optString("error", msg)
                    val c = json.optString("code", "")
                    if (c.isNotEmpty()) apiCode = c
                } catch (_: Exception) {
                    msg = body
                }
            }
            return ApiError(statusCode, apiCode, msg)
        }
    }
}
