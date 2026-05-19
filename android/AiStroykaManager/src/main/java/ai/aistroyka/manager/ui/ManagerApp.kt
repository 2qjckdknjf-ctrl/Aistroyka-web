package ai.aistroyka.manager.ui

import ai.aistroyka.manager.R
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import ai.aistroyka.manager.ManagerViewModel
import ai.aistroyka.shared.GetStartedDto
import ai.aistroyka.shared.HelpAssistantRiskSignalDto
import ai.aistroyka.shared.HelpHintDto
import ai.aistroyka.shared.ReportMediaItemDto
import coil.compose.AsyncImage

private const val MANAGER_PREFS = "aistroyka_manager_prefs"
private const val MANAGER_FIRST_LAUNCH_KEY = "first_launch_guide_seen"

@OptIn(ExperimentalComposeUiApi::class)
private fun Modifier.pilotAutomatorTag(tag: String): Modifier =
    semantics { testTagsAsResourceId = true }.testTag(tag)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManagerApp() {
    val vm: ManagerViewModel = viewModel()
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences(MANAGER_PREFS, 0) }
    var showGuide by rememberSaveable { mutableStateOf(!prefs.getBoolean(MANAGER_FIRST_LAUNCH_KEY, false)) }

    AiStroykaManagerTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(stringResource(R.string.manager_topbar_title)) },
                    actions = {
                        if (state.screen != "login") {
                            TextButton(onClick = { vm.logout() }) { Text(stringResource(R.string.action_sign_out)) }
                        }
                    }
                )
            }
        ) { padding ->
            Surface(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                color = MaterialTheme.colorScheme.background
            ) {
                Box(Modifier.fillMaxSize()) {
                    when (state.screen) {
                        "login" -> LoginScreen(vm)
                        "home" -> HomeScreen(vm)
                        "reports" -> ReportsScreen(vm)
                        "detail" -> DetailScreen(vm)
                        else -> LoginScreen(vm)
                    }
                    if (showGuide) {
                        FirstLaunchGuide(
                            onDismiss = {
                                prefs.edit().putBoolean(MANAGER_FIRST_LAUNCH_KEY, true).apply()
                                showGuide = false
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FirstLaunchGuide(onDismiss: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.scrim.copy(alpha = 0.55f))
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            shape = RoundedCornerShape(20.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = stringResource(R.string.manager_guide_title),
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    text = stringResource(R.string.manager_guide_subtitle),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(text = "1. ${stringResource(R.string.manager_guide_step_1)}")
                Text(text = "2. ${stringResource(R.string.manager_guide_step_2)}")
                Text(text = "3. ${stringResource(R.string.manager_guide_step_3)}")
                Button(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = onDismiss
                ) {
                    Text(stringResource(R.string.manager_guide_start))
                }
            }
        }
    }
}

@Composable
private fun LoginScreen(vm: ManagerViewModel) {
    val state by vm.state.collectAsState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(stringResource(R.string.manager_login_prompt), style = MaterialTheme.typography.bodyLarge)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = state.email,
            onValueChange = { vm.setEmail(it) },
            label = { Text(stringResource(R.string.label_email)) },
            modifier = Modifier
                .fillMaxWidth()
                .pilotAutomatorTag("pilot_manager_email"),
            singleLine = true,
            enabled = !state.busy
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = state.password,
            onValueChange = { vm.setPassword(it) },
            label = { Text(stringResource(R.string.label_password)) },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier
                .fillMaxWidth()
                .pilotAutomatorTag("pilot_manager_password"),
            singleLine = true,
            enabled = !state.busy
        )
        Spacer(Modifier.height(16.dp))
        state.banner?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
            Spacer(Modifier.height(8.dp))
        }
        Button(
            onClick = { vm.login() },
            enabled = !state.busy,
            modifier = Modifier
                .fillMaxWidth()
                .pilotAutomatorTag("pilot_manager_sign_in")
        ) {
            if (state.busy) {
                CircularProgressIndicator(
                    Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text(stringResource(R.string.action_sign_in))
            }
        }
    }
}

@Composable
private fun HomeScreen(vm: ManagerViewModel) {
    val state by vm.state.collectAsState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {
        state.meSummary?.let { Text(it, style = MaterialTheme.typography.titleMedium) }
        Spacer(Modifier.height(8.dp))
        state.opsPendingLine?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
        Spacer(Modifier.height(16.dp))
        StartGuidanceCard(
            getStarted = state.getStarted,
            hints = state.helpHints,
            guideSummary = state.guideSummary,
            guideConfidence = state.guideConfidence,
            guideRiskSignals = state.guideRiskSignals,
        )
        Spacer(Modifier.height(16.dp))
        state.banner?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
            TextButton(onClick = { vm.clearBanner() }) { Text(stringResource(R.string.action_dismiss)) }
            Spacer(Modifier.height(8.dp))
        }
        Text(stringResource(R.string.manager_project_filter), style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { vm.selectProject(null) },
            verticalAlignment = Alignment.CenterVertically
        ) {
            RadioButton(
                selected = state.selectedProjectId == null,
                onClick = { vm.selectProject(null) }
            )
            Text(stringResource(R.string.manager_all_projects), Modifier.padding(start = 8.dp))
        }
        state.projects.forEach { p ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { vm.selectProject(p.id) },
                verticalAlignment = Alignment.CenterVertically
            ) {
                RadioButton(
                    selected = state.selectedProjectId == p.id,
                    onClick = { vm.selectProject(p.id) }
                )
                Text(p.name ?: p.id, Modifier.padding(start = 8.dp))
            }
        }
        Spacer(Modifier.height(24.dp))
        Button(
            onClick = { vm.openReports() },
            enabled = !state.busy,
            modifier = Modifier
                .fillMaxWidth()
                .pilotAutomatorTag("pilot_manager_reports_inbox")
        ) {
            Text(stringResource(R.string.manager_reports_inbox))
        }
        Spacer(Modifier.height(12.dp))
        TextButton(onClick = { vm.refreshBootstrap() }, enabled = !state.busy) {
            Text(stringResource(R.string.action_refresh))
        }
    }
}

@Composable
private fun StartGuidanceCard(
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
                text = stringResource(R.string.manager_start_title),
                style = MaterialTheme.typography.titleSmall
            )
            Text(
                text = stringResource(R.string.manager_start_progress_fmt, completed, total),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "${if (getStarted?.createProject == true) "✓" else "○"} ${stringResource(R.string.manager_start_step_1)}",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = "${if (getStarted?.inviteTeam == true) "✓" else "○"} ${stringResource(R.string.manager_start_step_2)}",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = "${if (getStarted?.addTask == true) "✓" else "○"} ${stringResource(R.string.manager_start_step_3)}",
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = stringResource(R.string.manager_ai_hints_title),
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
                    text = stringResource(R.string.manager_ai_guide_confidence_fmt, guideConfidence),
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
                    text = "\u2022 ${stringResource(R.string.manager_ai_hint_1)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "\u2022 ${stringResource(R.string.manager_ai_hint_2)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (guideRiskSignals.isNotEmpty()) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = stringResource(R.string.manager_ai_risk_signals_title),
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

@Composable
private fun ReportsScreen(vm: ManagerViewModel) {
    val state by vm.state.collectAsState()
    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = { vm.backToHome() }) { Text(stringResource(R.string.manager_home)) }
            Text(stringResource(R.string.manager_reports_title), style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.size(48.dp))
        }
        Row(
            Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(stringResource(R.string.manager_submitted_only), modifier = Modifier.weight(1f))
            Switch(
                checked = state.reportsFilterSubmittedOnly,
                onCheckedChange = {
                    vm.setReportsFilterSubmittedOnly(it)
                    vm.loadReports()
                }
            )
        }
        state.banner?.let {
            Text(
                it,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(16.dp)
            )
            TextButton(onClick = { vm.clearBanner() }) { Text(stringResource(R.string.action_dismiss)) }
        }
        if (state.busy && state.reports.isEmpty()) {
            BoxCentered { CircularProgressIndicator() }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                itemsIndexed(state.reports, key = { _, r -> r.id }) { index, r ->
                    // Row keeps pilot testTag on one merged node (Card swallowed tag for Maestro).
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .pilotAutomatorTag("pilot_manager_report_row_$index")
                            .clickable { vm.openReportDetail(r.id) }
                    ) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Column(Modifier.padding(12.dp)) {
                                Text(
                                    r.id,
                                    style = MaterialTheme.typography.titleSmall,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    stringResource(
                                        R.string.manager_report_row_status,
                                        managerStatusLabel(r.status),
                                        r.mediaCount ?: 0
                                    ),
                                    style = MaterialTheme.typography.bodySmall
                                )
                                r.analysisStatus?.let { s ->
                                    Text(stringResource(R.string.manager_report_row_ai, s), style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BoxCentered(content: @Composable () -> Unit) {
    Column(
        Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) { content() }
}

@Composable
private fun DetailScreen(vm: ManagerViewModel) {
    val state by vm.state.collectAsState()
    val detail = state.reportDetail
    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = { vm.backToReports() }) { Text(stringResource(R.string.action_back)) }
        }
        if (state.busy && detail == null) {
            BoxCentered { CircularProgressIndicator() }
            return
        }
        if (detail == null) {
            Text(stringResource(R.string.manager_no_report), Modifier.padding(16.dp))
            return
        }
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            state.banner?.let {
                Text(it, color = MaterialTheme.colorScheme.error)
                Spacer(Modifier.height(8.dp))
            }
            Text(
                stringResource(R.string.manager_report_title, detail.id ?: "—"),
                style = MaterialTheme.typography.titleLarge
            )
            Text(stringResource(R.string.manager_status_line, managerStatusLabel(detail.status)), style = MaterialTheme.typography.bodyMedium)
            detail.submittedAt?.let { Text(stringResource(R.string.manager_submitted_line, it), style = MaterialTheme.typography.bodySmall) }
            detail.reviewedAt?.let { Text(stringResource(R.string.manager_reviewed_line, it), style = MaterialTheme.typography.bodySmall) }
            detail.managerNote?.let { Text(stringResource(R.string.manager_note_line, it), style = MaterialTheme.typography.bodySmall) }
            Spacer(Modifier.height(16.dp))
            Text(stringResource(R.string.manager_ai_analysis_jobs), style = MaterialTheme.typography.titleMedium)
            state.analysisStatus?.let { a ->
                Text(
                    stringResource(R.string.manager_pipeline_line, managerAnalysisStatusLabel(a.status), a.jobCount ?: 0),
                    style = MaterialTheme.typography.bodyMedium
                )
                a.summary?.let { s ->
                    Text(
                        stringResource(R.string.manager_media_jobs_line, s.mediaTotal ?: 0, s.analyzed ?: 0, s.failed ?: 0),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            } ?: Text(stringResource(R.string.manager_no_analysis_status), style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(16.dp))
            Text(stringResource(R.string.manager_media), style = MaterialTheme.typography.titleMedium)
            val media = detail.media.orEmpty()
            if (media.isEmpty()) {
                Text(stringResource(R.string.manager_no_media_rows), style = MaterialTheme.typography.bodySmall)
            } else {
                media.forEach { m ->
                    MediaRow(m, state.mediaPreviewUrls)
                    Spacer(Modifier.height(12.dp))
                }
            }
            Spacer(Modifier.height(24.dp))
            val canReview = detail.status == "submitted"
            if (canReview) {
                Text(stringResource(R.string.manager_note_optional), style = MaterialTheme.typography.labelLarge)
                OutlinedTextField(
                    value = state.reviewNote,
                    onValueChange = { vm.setReviewNote(it) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
                state.reviewValidationError?.let { key ->
                    val msg = when (key) {
                        "manager_note_required_reject_or_changes" -> stringResource(R.string.manager_note_required_reject_or_changes)
                        else -> key
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(msg, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }
                Spacer(Modifier.height(12.dp))
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { vm.submitReview("approved") },
                        enabled = !state.busy,
                        modifier = Modifier
                            .weight(1f)
                            .pilotAutomatorTag("pilot_manager_approve")
                    ) { Text(stringResource(R.string.manager_approve)) }
                    Button(
                        onClick = { vm.submitReview("rejected") },
                        enabled = !state.busy,
                        modifier = Modifier.weight(1f)
                    ) { Text(stringResource(R.string.manager_reject)) }
                }
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = { vm.submitReview("changes_requested") },
                    enabled = !state.busy,
                    modifier = Modifier.fillMaxWidth()
                ) { Text(stringResource(R.string.manager_request_changes)) }
            } else {
                Text(
                    stringResource(R.string.manager_review_only_submitted),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            state.actionMessage?.let {
                Spacer(Modifier.height(16.dp))
                Text(it, color = MaterialTheme.colorScheme.primary)
            }
            if (state.busy) {
                Spacer(Modifier.height(16.dp))
                CircularProgressIndicator(Modifier.size(32.dp))
            }
        }
    }
}

@Composable
private fun MediaRow(item: ReportMediaItemDto, urlById: Map<String, String>) {
    val mid = item.mediaId
    val url = mid?.let { urlById[it] }
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(8.dp)) {
            Text(stringResource(R.string.manager_media_id_line, mid ?: "—", item.uploadSessionId ?: "—"), style = MaterialTheme.typography.bodySmall)
            if (url != null) {
                AsyncImage(
                    model = url,
                    contentDescription = stringResource(R.string.content_desc_report_media),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp),
                    contentScale = ContentScale.Fit
                )
            } else {
                Text(
                    stringResource(R.string.manager_no_preview_url),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun managerStatusLabel(status: String?): String {
    return when (status?.lowercase()) {
        "submitted" -> stringResource(R.string.manager_status_submitted)
        "approved" -> stringResource(R.string.manager_status_approved)
        "rejected" -> stringResource(R.string.manager_status_rejected)
        "changes_requested" -> stringResource(R.string.manager_status_changes_requested)
        "open" -> stringResource(R.string.manager_status_open)
        else -> status ?: stringResource(R.string.manager_status_unknown)
    }
}

@Composable
private fun managerAnalysisStatusLabel(status: String?): String {
    return when (status?.lowercase()) {
        "pending" -> stringResource(R.string.manager_analysis_status_pending)
        "running" -> stringResource(R.string.manager_analysis_status_running)
        "done", "completed", "success" -> stringResource(R.string.manager_analysis_status_completed)
        "failed", "error" -> stringResource(R.string.manager_analysis_status_failed)
        else -> status ?: stringResource(R.string.manager_status_unknown)
    }
}
