package ai.aistroyka.worker.ui

import ai.aistroyka.worker.R
import ai.aistroyka.worker.WorkerUiState
import ai.aistroyka.worker.WorkerViewModel
import ai.aistroyka.shared.GetStartedDto
import ai.aistroyka.shared.HelpApi
import ai.aistroyka.shared.HelpAssistantRiskSignalDto
import ai.aistroyka.shared.HelpHintDto
import ai.aistroyka.shared.SessionStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import java.util.Locale

private const val WORKER_PREFS = "aistroyka_worker_prefs"
private const val WORKER_FIRST_LAUNCH_KEY = "first_launch_guide_seen"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkerApp() {
    val vm: WorkerViewModel = viewModel()
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences(WORKER_PREFS, 0) }
    var showGuide by rememberSaveable { mutableStateOf(!prefs.getBoolean(WORKER_FIRST_LAUNCH_KEY, false)) }
    var getStarted by remember { mutableStateOf<GetStartedDto?>(null) }
    var hints by remember { mutableStateOf<List<HelpHintDto>>(emptyList()) }
    var guideSummary by remember { mutableStateOf<String?>(null) }
    var guideConfidence by remember { mutableStateOf<Int?>(null) }
    var guideRiskSignals by remember { mutableStateOf<List<HelpAssistantRiskSignalDto>>(emptyList()) }

    LaunchedEffect(state.screen) {
        if (state.screen != "home" || !SessionStore.hasSession()) return@LaunchedEffect
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
                    getStarted = activation.getStarted,
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
        try {
            HelpApi.helpAssistantEvent(
                type = "open",
                locale = supportedHelpLocale(),
                role = "worker",
                pathname = "/worker",
            )
        } catch (_: Exception) {
        }
        guideSummary = assistant?.summary
        guideConfidence = assistant?.confidence
        guideRiskSignals = assistant?.riskSignals.orEmpty()
    }

    AiStroykaWorkerTheme {
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            when (state.screen) {
                "login" -> WorkerLoginScreen(vm, state)
                "report" -> WorkerReportScreen(vm, state)
                else -> WorkerHomeScaffold(
                    vm = vm,
                    state = state,
                    getStarted = getStarted,
                    hints = hints,
                    guideSummary = guideSummary,
                    guideConfidence = guideConfidence,
                    guideRiskSignals = guideRiskSignals,
                )
            }

            if (showGuide) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.scrim.copy(alpha = 0.55f))
                        .padding(20.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = stringResource(R.string.worker_guide_title),
                                style = MaterialTheme.typography.titleLarge,
                            )
                            Text(
                                modifier = Modifier.padding(top = 8.dp),
                                text = stringResource(R.string.worker_guide_subtitle),
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            Text(
                                modifier = Modifier.padding(top = 10.dp),
                                text = "1. ${stringResource(R.string.worker_guide_step_1)}",
                            )
                            Text(
                                modifier = Modifier.padding(top = 6.dp),
                                text = "2. ${stringResource(R.string.worker_guide_step_2)}",
                            )
                            Text(
                                modifier = Modifier.padding(top = 6.dp),
                                text = "3. ${stringResource(R.string.worker_guide_step_3)}",
                            )
                            Button(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 12.dp),
                                onClick = {
                                    prefs.edit().putBoolean(WORKER_FIRST_LAUNCH_KEY, true).apply()
                                    showGuide = false
                                },
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkerHomeScaffold(
    vm: WorkerViewModel,
    state: WorkerUiState,
    getStarted: GetStartedDto?,
    hints: List<HelpHintDto>,
    guideSummary: String?,
    guideConfidence: Int?,
    guideRiskSignals: List<HelpAssistantRiskSignalDto>,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.worker_topbar_title)) },
                actions = {
                    TextButton(onClick = { vm.logout() }) {
                        Text(stringResource(R.string.action_sign_out))
                    }
                },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (state.busy) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
            state.banner?.let { msg ->
                Text(text = msg, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                TextButton(onClick = { vm.clearBanner() }) { Text(stringResource(R.string.action_dismiss)) }
            }
            state.configHint?.let { Text(it, style = MaterialTheme.typography.bodySmall) }

            WorkerStartGuidanceCard(
                getStarted = getStarted,
                hints = hints,
                guideSummary = guideSummary,
                guideConfidence = guideConfidence,
                guideRiskSignals = guideRiskSignals,
            )

            Text(
                if (state.shiftDayId != null) {
                    stringResource(R.string.worker_shift_in_progress)
                } else {
                    stringResource(R.string.worker_shift_not_started)
                },
                style = MaterialTheme.typography.titleSmall,
            )
            Column {
                Button(
                    onClick = { vm.startShift() },
                    enabled = state.shiftDayId == null && !state.busy,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(stringResource(R.string.worker_start_shift))
                }
                Spacer(Modifier.height(6.dp))
                OutlinedButton(
                    onClick = { vm.endShift() },
                    enabled = state.shiftDayId != null && !state.busy,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(stringResource(R.string.worker_end_shift))
                }
            }

            Text(stringResource(R.string.projects_heading), style = MaterialTheme.typography.titleSmall)
            if (state.projects.isEmpty()) {
                Text(stringResource(R.string.projects_empty), style = MaterialTheme.typography.bodySmall)
            } else {
                state.projects.forEach { p ->
                    val selected = p.id == state.selectedProjectId
                    TextButton(onClick = { vm.selectProject(p.id) }) {
                        Text(
                            if (selected) "✓ ${p.name ?: p.id}" else "${p.name ?: p.id}",
                        )
                    }
                }
            }

            Text(stringResource(R.string.tasks_today_heading), style = MaterialTheme.typography.titleSmall)
            if (state.tasks.isEmpty()) {
                Text(stringResource(R.string.task_none), style = MaterialTheme.typography.bodySmall)
            } else {
                state.tasks.forEach { t ->
                    val sel = t.id == state.selectedTaskId
                    TextButton(onClick = { vm.selectTask(t.id) }) {
                        Text(if (sel) "✓ ${t.title}" else t.title)
                    }
                }
            }

            Button(
                onClick = { vm.refreshBootstrap() },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(stringResource(R.string.action_refresh_config))
            }
            Button(
                onClick = { vm.startNewReport() },
                modifier = Modifier.fillMaxWidth(),
                enabled = !state.busy,
            ) {
                Text(stringResource(R.string.action_create_report_photo))
            }
        }
    }
}

@Composable
private fun WorkerLoginScreen(vm: WorkerViewModel, state: WorkerUiState) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(stringResource(R.string.app_name), style = MaterialTheme.typography.headlineSmall)
        Text(stringResource(R.string.login_prompt), style = MaterialTheme.typography.bodyMedium)
        if (state.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
        state.banner?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        OutlinedTextField(
            value = state.email,
            onValueChange = { vm.setEmail(it) },
            label = { Text(stringResource(R.string.label_email)) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = state.password,
            onValueChange = { vm.setPassword(it) },
            label = { Text(stringResource(R.string.label_password)) },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            onClick = { vm.login() },
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.busy,
        ) {
            Text(stringResource(R.string.action_sign_in))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkerReportScreen(vm: WorkerViewModel, state: WorkerUiState) {
    val pickImage = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        vm.onPhotoPicked(uri)
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.report_draft_title)) },
                actions = {
                    TextButton(onClick = { vm.backToHome() }) {
                        Text(stringResource(R.string.action_back_home))
                    }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (state.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
            state.activeReportId?.let { Text(stringResource(R.string.report_id_line, it)) }
            val beforeLabel = if (state.beforePhotoAttached) "✓" else "—"
            val afterLabel = if (state.afterPhotoAttached) "✓" else "—"
            Text(
                stringResource(R.string.worker_photo_status_fmt, beforeLabel, afterLabel),
                style = MaterialTheme.typography.bodySmall,
            )
            state.pipelineStatus?.let { Text(it) }
            state.banner?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            Button(onClick = { pickImage.launch("image/*") }, enabled = !state.busy) {
                Text(stringResource(R.string.action_choose_photo))
            }
            OutlinedTextField(
                value = state.workerNote,
                onValueChange = { vm.setWorkerNote(it) },
                label = { Text(stringResource(R.string.worker_report_note_label)) },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
            )
            state.submitMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            state.doneMessage?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            Button(
                onClick = { vm.submitReport() },
                enabled = !state.busy && state.doneMessage == null,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(stringResource(R.string.action_submit_report))
            }
            if (state.doneMessage != null) {
                Button(onClick = { vm.dismissDone() }, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(R.string.action_dismiss))
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
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                text = stringResource(R.string.worker_start_title),
                style = MaterialTheme.typography.titleSmall,
            )
            Text(
                text = stringResource(R.string.worker_start_progress_fmt, completed, total),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = "${if (getStarted?.addTask == true) "✓" else "○"} ${stringResource(R.string.worker_start_step_1)}",
                style = MaterialTheme.typography.bodySmall,
            )
            Text(
                text = "${if (getStarted?.uploadReport == true) "✓" else "○"} ${stringResource(R.string.worker_start_step_2)}",
                style = MaterialTheme.typography.bodySmall,
            )
            Text(
                text = "${if (getStarted?.viewAi == true) "✓" else "○"} ${stringResource(R.string.worker_start_step_3)}",
                style = MaterialTheme.typography.bodySmall,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = stringResource(R.string.worker_ai_hints_title),
                style = MaterialTheme.typography.labelLarge,
            )
            if (!guideSummary.isNullOrBlank()) {
                Text(
                    text = guideSummary,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (guideConfidence != null) {
                Text(
                    text = stringResource(R.string.worker_ai_guide_confidence_fmt, guideConfidence),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            if (hints.isNotEmpty()) {
                hints.take(2).forEach { hint ->
                    Text(
                        text = "\u2022 ${hint.title}",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    if (hint.reason.isNotBlank()) {
                        Text(
                            text = hint.reason,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            } else {
                Text(
                    text = "\u2022 ${stringResource(R.string.worker_ai_hint_1)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    text = "\u2022 ${stringResource(R.string.worker_ai_hint_2)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (guideRiskSignals.isNotEmpty()) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = stringResource(R.string.worker_ai_risk_signals_title),
                    style = MaterialTheme.typography.labelLarge,
                )
                guideRiskSignals.take(2).forEach { signal ->
                    Text(
                        text = "\u2022 ${signal.title}",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Text(
                        text = signal.detail,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
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
