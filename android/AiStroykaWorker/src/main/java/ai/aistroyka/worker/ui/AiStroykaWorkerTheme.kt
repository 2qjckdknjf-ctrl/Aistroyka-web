package ai.aistroyka.worker.ui

import ai.aistroyka.shared.design.BrandTokens
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val WorkerDarkColorScheme = darkColorScheme(
    primary = Color(BrandTokens.ACTION_PRIMARY),
    onPrimary = Color(BrandTokens.TEXT_ON_PRIMARY),
    secondary = Color(BrandTokens.STATE_INFO),
    onSecondary = Color(BrandTokens.TEXT_PRIMARY),
    background = Color(BrandTokens.BG_PAGE),
    onBackground = Color(BrandTokens.TEXT_PRIMARY),
    surface = Color(BrandTokens.SURFACE),
    onSurface = Color(BrandTokens.TEXT_PRIMARY),
    surfaceVariant = Color(BrandTokens.SURFACE_MUTED),
    onSurfaceVariant = Color(BrandTokens.TEXT_SECONDARY),
    error = Color(BrandTokens.STATE_ERROR),
    onError = Color(BrandTokens.TEXT_PRIMARY),
    outline = Color(BrandTokens.BORDER_SUBTLE),
    outlineVariant = Color(BrandTokens.BORDER_STRONG),
    scrim = Color(BrandTokens.OVERLAY_DIM),
)

@Composable
fun AiStroykaWorkerTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = WorkerDarkColorScheme, content = content)
}
