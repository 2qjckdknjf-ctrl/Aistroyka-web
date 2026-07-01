package ai.aistroyka.manager.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import ai.aistroyka.manager.ManagerViewModel
import ai.aistroyka.shared.ReportMediaItemDto
import coil.compose.AsyncImage

@OptIn(ExperimentalComposeUiApi::class)
private fun Modifier.pilotAutomatorTag(tag: String): Modifier =
    semantics { testTagsAsResourceId = true }.testTag(tag)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManagerApp() {
    val vm: ManagerViewModel = viewModel()
    val state by vm.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AiStroyka Manager") },
                actions = {
                    if (state.screen != "login") {
                        TextButton(onClick = { vm.logout() }) { Text("Sign out") }
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
            when (state.screen) {
                "login" -> LoginScreen(vm)
                "home" -> HomeScreen(vm)
                "reports" -> ReportsScreen(vm)
                "detail" -> DetailScreen(vm)
                else -> LoginScreen(vm)
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
        Text("Manager sign-in", style = MaterialTheme.typography.bodyLarge)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = state.email,
            onValueChange = { vm.setEmail(it) },
            label = { Text("Email") },
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
            label = { Text("Password") },
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
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(
                    if (state.busy) MaterialTheme.colorScheme.surfaceVariant
                    else MaterialTheme.colorScheme.primary
                )
                .clickable(enabled = !state.busy) { vm.login() }
                .pilotAutomatorTag("pilot_manager_sign_in"),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (state.busy) {
                CircularProgressIndicator(
                    Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.primary
                )
            } else {
                Text("Sign in", color = MaterialTheme.colorScheme.onPrimary)
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
        state.banner?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
            TextButton(onClick = { vm.clearBanner() }) { Text("Dismiss") }
            Spacer(Modifier.height(8.dp))
        }
        Text("Project filter", style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            RadioButton(
                selected = state.selectedProjectId == null,
                onClick = { vm.selectProject(null) }
            )
            Text("All projects", Modifier.padding(start = 8.dp))
        }
        state.projects.forEach { p ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                androidx.compose.material3.RadioButton(
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
            Text("Reports inbox")
        }
        Spacer(Modifier.height(12.dp))
        TextButton(onClick = { vm.refreshBootstrap() }, enabled = !state.busy) {
            Text("Refresh")
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
            TextButton(onClick = { vm.backToHome() }) { Text("Home") }
            Text("Reports", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.size(48.dp))
        }
        Row(
            Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Submitted only", modifier = Modifier.weight(1f))
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
            TextButton(onClick = { vm.clearBanner() }) { Text("Dismiss") }
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
                                Text(r.id, style = MaterialTheme.typography.titleSmall)
                                Text(
                                    "Status: ${r.status ?: "—"} · Media: ${r.mediaCount ?: 0}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                                r.analysisStatus?.let { s ->
                                    Text("AI: $s", style = MaterialTheme.typography.bodySmall)
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
            TextButton(onClick = { vm.backToReports() }) { Text("Back") }
        }
        if (state.busy && detail == null) {
            BoxCentered { CircularProgressIndicator() }
            return
        }
        if (detail == null) {
            Text("No report", Modifier.padding(16.dp))
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
            Text("Report ${detail.id}", style = MaterialTheme.typography.titleLarge)
            Text("Status: ${detail.status ?: "—"}", style = MaterialTheme.typography.bodyMedium)
            detail.submittedAt?.let { Text("Submitted: $it", style = MaterialTheme.typography.bodySmall) }
            detail.reviewedAt?.let { Text("Reviewed: $it", style = MaterialTheme.typography.bodySmall) }
            detail.managerNote?.let { Text("Manager note: $it", style = MaterialTheme.typography.bodySmall) }
            Spacer(Modifier.height(16.dp))
            Text("AI analysis jobs", style = MaterialTheme.typography.titleMedium)
            state.analysisStatus?.let { a ->
                Text("Pipeline: ${a.status} · jobs: ${a.jobCount ?: 0}", style = MaterialTheme.typography.bodyMedium)
                a.summary?.let { s ->
                    Text(
                        "Media jobs: ${s.mediaTotal ?: 0} · analyzed: ${s.analyzed ?: 0} · failed: ${s.failed ?: 0}",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            } ?: Text("No analysis status loaded.", style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(16.dp))
            Text("Media", style = MaterialTheme.typography.titleMedium)
            val media = detail.media.orEmpty()
            if (media.isEmpty()) {
                Text("No media rows on report.", style = MaterialTheme.typography.bodySmall)
            } else {
                media.forEach { m ->
                    MediaRow(m, state.mediaPreviewUrls)
                    Spacer(Modifier.height(12.dp))
                }
            }
            Spacer(Modifier.height(24.dp))
            val canReview = detail.status == "submitted"
            if (canReview) {
                Text("Manager note (optional)", style = MaterialTheme.typography.labelLarge)
                OutlinedTextField(
                    value = state.reviewNote,
                    onValueChange = { vm.setReviewNote(it) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
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
                    ) { Text("Approve") }
                    Button(
                        onClick = { vm.submitReview("rejected") },
                        enabled = !state.busy,
                        modifier = Modifier.weight(1f)
                    ) { Text("Reject") }
                }
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = { vm.submitReview("changes_requested") },
                    enabled = !state.busy,
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Request changes") }
            } else {
                Text(
                    "Review actions are only available when status is submitted.",
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
            Text(
                "Media id: ${mid ?: "—"} · session: ${item.uploadSessionId ?: "—"}",
                style = MaterialTheme.typography.bodySmall
            )
            if (url != null) {
                AsyncImage(
                    model = url,
                    contentDescription = "Report media",
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp),
                    contentScale = ContentScale.Fit
                )
            } else {
                Text(
                    "No preview URL (resolve via project media list when project is known).",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
