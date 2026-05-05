package ai.aistroyka.shared

import kotlinx.serialization.Serializable

/**
 * Mobile onboarding/help API helpers aligned with web `/api/v1/activation/status` and `/api/v1/help/hints`.
 */
object HelpApi {
    suspend fun activationStatus(): ActivationStatusDto =
        ApiClient.request("activation/status")

    suspend fun helpHints(
        locale: String,
        role: String,
        getStarted: GetStartedDto?,
    ): List<HelpHintDto> {
        val body = HelpHintsRequest(
            locale = locale,
            role = role,
            getStarted = getStarted
        )
        val json = ApiClient.json.encodeToString(HelpHintsRequest.serializer(), body)
        val response: HelpHintsResponse = ApiClient.request(
            path = "help/hints",
            method = "POST",
            jsonBody = json,
        )
        return response.hints.orEmpty()
    }
}

@Serializable
data class ActivationStatusDto(
    val projectCount: Int? = null,
    val hasInvited: Boolean? = null,
    val taskCount: Int? = null,
    val reportCount: Int? = null,
    val hasAiInsight: Boolean? = null,
    val showOnboarding: Boolean? = null,
    val getStarted: GetStartedDto? = null,
)

@Serializable
data class GetStartedDto(
    val createProject: Boolean = false,
    val inviteTeam: Boolean = false,
    val addTask: Boolean = false,
    val uploadReport: Boolean = false,
    val viewAi: Boolean = false,
)

@Serializable
data class HelpHintDto(
    val step: String,
    val title: String,
    val reason: String,
    val action: String,
    val href: String,
)

@Serializable
private data class HelpHintsRequest(
    val locale: String,
    val role: String,
    val getStarted: GetStartedDto? = null,
)

@Serializable
private data class HelpHintsResponse(
    val hints: List<HelpHintDto>? = null,
)
