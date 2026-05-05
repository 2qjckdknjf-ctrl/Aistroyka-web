package ai.aistroyka.worker.ui

import ai.aistroyka.worker.R
import ai.aistroyka.shared.GetStartedDto
import ai.aistroyka.shared.HelpApi
import ai.aistroyka.shared.HelpAssistantRiskSignalDto
import ai.aistroyka.shared.HelpHintDto
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import java.util.Locale

private const val WORKER_PREFS = "aistroyka_worker_prefs"
private const val WORKER_FIRST_LAUNCH_KEY = "first_launch_guide_seen"

@Composable
fun WorkerApp() {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences(WORKER_PREFS, 0) }
    var showGuide by rememberSaveable { mutableStateOf(!prefs.getBoolean(WORKER_FIRST_LAUNCH_KEY, false)) }
    var getStarted by remember { mutableStateOf<GetStartedDto?>(null) }
    var hints by remember { mutableStateOf<List<HelpHintDto>>(emptyList()) }
    var guideSummary by remember { mutableStateOf<String?>(null) }
    var guideConfidence by remember { mutableStateOf<Int?>(null) }
    var guideRiskSignals by remember { mutableStateOf<List<HelpAssistantRiskSignalDto>>(emptyList()) }

    LaunchedEffect(Unit) {
        val activation = try {
            HelpApi.activationStatus()
        } catch (_: Exception) {
            null
        }
        getStarted = activation?.getStarted
        hints = if (activation?.getStarted != null) {
            try {
                HelpApi.helpHints(
                    locale = supportedHelpLocale(),
                    role = "manager",
                    getStarted = activation.getStarted
                )
            } catch (_: Exception) {
                emptyList()
            }
        } else {
            emptyList()
        }
        val assistant = try {
            HelpApi.helpAssistant(
                query = "",
                locale = supportedHelpLocale(),
                role = "manager",
                pathname = "/worker",
                getStarted = activation?.getStarted,
                projectCount = activation?.projectCount,
                taskCount = activation?.taskCount,
                reportCount = activation?.reportCount,
                hasAiInsight = activation?.hasAiInsight,
            )
        } catch (_: Exception) {
            null
        }
        guideSummary = assistant?.summary
        guideConfidence = assistant?.confidence
        guideRiskSignals = assistant?.riskSignals.orEmpty()
    }

    AiStroykaWorkerTheme {
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = stringResource(R.string.app_name),
                        style = MaterialTheme.typography.titleLarge
                    )
                    WorkerStartGuidanceCard(
                        getStarted = getStarted,
                        hints = hints,
                        guideSummary = guideSummary,
                        guideConfidence = guideConfidence,
                        guideRiskSignals = guideRiskSignals,
                    )
                }
            }
            if (showGuide) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.scrim.copy(alpha = 0.55f))
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = stringResource(R.string.worker_guide_title),
                                style = MaterialTheme.typography.titleLarge
                            )
                            Text(
                                modifier = Modifier.padding(top = 8.dp),
                                text = stringResource(R.string.worker_guide_subtitle),
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Text(
                                modifier = Modifier.padding(top = 10.dp),
                                text = "1. ${stringResource(R.string.worker_guide_step_1)}"
                            )
                            Text(
                                modifier = Modifier.padding(top = 6.dp),
                                text = "2. ${stringResource(R.string.worker_guide_step_2)}"
                            )
                            Text(
                                modifier = Modifier.padding(top = 6.dp),
                                text = "3. ${stringResource(R.string.worker_guide_step_3)}"
                            )
                            Button(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 12.dp),
                                onClick = {
                                    prefs.edit().putBoolean(WORKER_FIRST_LAUNCH_KEY, true).apply()
                                    showGuide = false
                                }
                            ) {
                                Text(stringResource(R.string.worker_guide_start))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WorkerStartGuidanceCard(
    getStarted: GetStartedDto?,
    hints: List<HelpHintDto>,
    guideSummary: String?,
    guideConfidence: Int?,
    guideRiskSignals: List<HelpAssistantRiskSignalDto>,
) {
    val completed = listOf(
        getStarted?.createProject,
        getStarted?.inviteTeam,
        getStarted?.addTask,
        getStarted?.uploadReport,
        getStarted?.viewAi,
    ).count { it == true }
    val total = 5

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                text = stringResource(R.string.worker_start_title),
                style = MaterialTheme.typography.titleSmall
            )
            Text(
                text = stringResource(R.string.worker_start_progress_fmt, completed, total),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "${if (getStarted?.addTask == true) "✓" else "○"} ${stringResource(R.string.worker_start_step_1)}",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = "${if (getStarted?.uploadReport == true) "✓" else "○"} ${stringResource(R.string.worker_start_step_2)}",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = "${if (getStarted?.viewAi == true) "✓" else "○"} ${stringResource(R.string.worker_start_step_3)}",
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = stringResource(R.string.worker_ai_hints_title),
                style = MaterialTheme.typography.labelLarge
            )
            if (!guideSummary.isNullOrBlank()) {
                Text(
                    text = guideSummary,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (guideConfidence != null) {
                Text(
                    text = stringResource(R.string.worker_ai_guide_confidence_fmt, guideConfidence),
                    style = MaterialTheme.typography.bodySmall
                )
            }
            if (hints.isNotEmpty()) {
                hints.take(2).forEach { hint ->
                    Text(
                        text = "\u2022 ${hint.title}",
                        style = MaterialTheme.typography.bodySmall
                    )
                    if (hint.reason.isNotBlank()) {
                        Text(
                            text = hint.reason,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                Text(
                    text = "\u2022 ${stringResource(R.string.worker_ai_hint_1)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "\u2022 ${stringResource(R.string.worker_ai_hint_2)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (guideRiskSignals.isNotEmpty()) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = stringResource(R.string.worker_ai_risk_signals_title),
                    style = MaterialTheme.typography.labelLarge
                )
                guideRiskSignals.take(2).forEach { signal ->
                    Text(
                        text = "\u2022 ${signal.title}",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        text = signal.detail,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

private fun supportedHelpLocale(): String {
    val language = Locale.getDefault().language.lowercase(Locale.ROOT)
    return when (language) {
        "ru", "es", "it" -> language
        else -> "en"
    }
}
