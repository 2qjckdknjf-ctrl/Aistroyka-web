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

    suspend fun helpAssistant(
        query: String,
        locale: String,
        role: String,
        pathname: String,
        getStarted: GetStartedDto?,
        projectCount: Int?,
        taskCount: Int?,
        reportCount: Int?,
        hasAiInsight: Boolean?,
    ): HelpAssistantResponseDto {
        val body = HelpAssistantRequest(
            query = query,
            locale = locale,
            role = role,
            pathname = pathname,
            getStarted = getStarted,
            projectCount = projectCount,
            taskCount = taskCount,
            reportCount = reportCount,
            hasAiInsight = hasAiInsight,
        )
        val json = ApiClient.json.encodeToString(HelpAssistantRequest.serializer(), body)
        return ApiClient.request(
            path = "help/assistant",
            method = "POST",
            jsonBody = json,
        )
    }

    suspend fun helpAssistantEvent(
        type: String,
        locale: String,
        role: String,
        pathname: String,
    ) {
        val body = HelpAssistantEventRequest(
            type = type,
            locale = locale,
            role = role,
            pathname = pathname,
        )
        val json = ApiClient.json.encodeToString(HelpAssistantEventRequest.serializer(), body)
        ApiClient.requestVoid(
            path = "help/assistant/events",
            method = "POST",
            jsonBody = json,
        )
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

@Serializable
data class HelpAssistantActionDto(
    val id: String,
    val title: String,
    val reason: String,
    val href: String,
    val priority: String,
)

@Serializable
data class HelpAssistantRiskSignalDto(
    val id: String,
    val title: String,
    val detail: String,
    val severity: String,
    val href: String,
)

@Serializable
data class HelpAssistantResponseDto(
    val summary: String,
    val answer: String,
    val actions: List<HelpAssistantActionDto>? = null,
    val riskSignals: List<HelpAssistantRiskSignalDto>? = null,
    val followUps: List<String>? = null,
    val confidence: Int? = null,
)

@Serializable
private data class HelpAssistantRequest(
    val query: String,
    val locale: String,
    val role: String,
    val pathname: String,
    val getStarted: GetStartedDto? = null,
    val projectCount: Int? = null,
    val taskCount: Int? = null,
    val reportCount: Int? = null,
    val hasAiInsight: Boolean? = null,
)

@Serializable
private data class HelpAssistantEventRequest(
    val type: String,
    val locale: String,
    val role: String,
    val pathname: String,
)
