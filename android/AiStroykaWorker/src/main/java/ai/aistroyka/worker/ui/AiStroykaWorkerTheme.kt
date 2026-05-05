package ai.aistroyka.worker.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val WorkerDarkColorScheme = darkColorScheme(
    primary = androidx.compose.ui.graphics.Color(0xFFF5C518),
    onPrimary = androidx.compose.ui.graphics.Color(0xFF0B0F19),
    secondary = androidx.compose.ui.graphics.Color(0xFF3B82F6),
    background = androidx.compose.ui.graphics.Color(0xFF0B0F19),
    onBackground = androidx.compose.ui.graphics.Color(0xFFF9FAFB),
    surface = androidx.compose.ui.graphics.Color(0xFF1F2937),
    onSurface = androidx.compose.ui.graphics.Color(0xFFF9FAFB),
    surfaceVariant = androidx.compose.ui.graphics.Color(0xFF111827),
    onSurfaceVariant = androidx.compose.ui.graphics.Color(0xFF9CA3AF),
    error = androidx.compose.ui.graphics.Color(0xFFFF3B30),
)

@Composable
fun AiStroykaWorkerTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = WorkerDarkColorScheme, content = content)
}
