package ai.aistroyka.shared.design

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.unit.dp

/**
 * Deterministic design gallery for screenshot matrix.
 * Activated via intent extra `design_preview` = screen id.
 * Not a Release auth bypass.
 */
enum class DesignPreviewScreen(val id: String) {
    Login("login"),
    FirstRun("first_run"),
    Home("home"),
    Projects("projects"),
    Tasks("tasks"),
    Reports("reports"),
    Settings("settings"),
    Empty("empty"),
    Error("error"),
    Loading("loading"),
    Offline("offline"),
    Media("media");

    companion object {
        fun fromId(raw: String?): DesignPreviewScreen? =
            entries.firstOrNull { it.id.equals(raw, ignoreCase = true) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DesignPreviewApp(
    screen: DesignPreviewScreen,
    appTitle: String,
    brandMarkResId: Int? = null,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(appTitle) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BrandColors.pageBackground(),
                    titleContentColor = BrandColors.textPrimary(),
                    actionIconContentColor = BrandColors.textPrimary(),
                ),
            )
        },
        containerColor = BrandColors.pageBackground(),
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
                .semantics { testTag = "design_preview_${screen.id}" },
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "preview:${screen.id} · $appTitle",
                color = BrandColors.textTertiary(),
                modifier = Modifier.semantics { testTag = "design_preview_app_identity" },
            )
            when (screen) {
                DesignPreviewScreen.Login -> LoginPreview(brandMarkResId)
                DesignPreviewScreen.FirstRun -> FirstRunPreview()
                DesignPreviewScreen.Home -> {
                    Text("Dashboard", color = BrandColors.textPrimary())
                    BrandCard {
                        Text("KPI", color = BrandColors.textMuted())
                        Text("12", color = BrandColors.textPrimary())
                    }
                }
                DesignPreviewScreen.Projects,
                DesignPreviewScreen.Tasks,
                DesignPreviewScreen.Reports,
                -> {
                    repeat(4) { i ->
                        BrandCard { Text("Row ${i + 1}", color = BrandColors.textPrimary()) }
                    }
                }
                DesignPreviewScreen.Settings -> {
                    BrandCard { Text("Signed in", color = BrandColors.success()) }
                    BrandCard { Text("Diagnostics", color = BrandColors.textMuted()) }
                }
                DesignPreviewScreen.Empty -> BrandEmptyState("Nothing here yet", "Deterministic empty state")
                DesignPreviewScreen.Error -> BrandErrorState(
                    message = "Something went wrong (preview)",
                    retryTitle = "Retry (preview)",
                    onRetry = {},
                )
                DesignPreviewScreen.Loading -> {
                    CircularProgressIndicator(color = BrandColors.primary())
                    Text("Loading preview…", color = BrandColors.textMuted())
                }
                DesignPreviewScreen.Offline -> BrandOfflineBanner("You are offline (preview)")
                DesignPreviewScreen.Media -> {
                    BrandMediaFrame(modifier = Modifier.height(160.dp)) {
                        if (brandMarkResId != null) {
                            Image(
                                painter = painterResource(brandMarkResId),
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                            )
                        } else {
                            Text("Photo", color = BrandColors.textMuted())
                        }
                    }
                    BrandBadge("Pending review", BrandBadgeTone.Warning)
                    BrandMutedText("Loading / error media frames use surfaceMuted + radius")
                }
            }
        }
    }
}

@Composable
private fun LoginPreview(brandMarkResId: Int?) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        if (brandMarkResId != null) {
            Image(
                painter = painterResource(brandMarkResId),
                contentDescription = "AISTROYKA brand mark",
                modifier = Modifier.size(72.dp),
            )
        }
        BrandOutlinedField(value = "email@example.com", onValueChange = {}, label = "Email")
        BrandOutlinedField(value = "••••••••", onValueChange = {}, label = "Password")
        BrandPrimaryButton(text = "Sign in", onClick = {})
        BrandPrimaryButton(text = "Sign in (disabled)", onClick = {}, enabled = false)
        BrandSecondaryButton(
            text = "Toolbar action",
            onClick = {},
            width = BrandButtonWidth.Compact,
        )
    }
}

@Composable
private fun FirstRunPreview() {
    BrandCard {
        Text("Welcome", color = BrandColors.textPrimary())
        Text("Quick first-run guide (separate from clean login)", color = BrandColors.textMuted())
        Text("1. Review queues")
        Text("2. Open projects")
        Text("3. Use AI statuses")
        BrandPrimaryButton(text = "Start working", onClick = {})
    }
}
