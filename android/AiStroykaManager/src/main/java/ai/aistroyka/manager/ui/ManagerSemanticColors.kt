package ai.aistroyka.manager.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

object ManagerSemanticColors {
    private val SuccessGreen = Color(0xFF34C759)
    private val WarningOrange = Color(0xFFFF9500)

    @Composable
    fun pageBackground() = MaterialTheme.colorScheme.background

    @Composable
    fun error() = MaterialTheme.colorScheme.error

    @Composable
    fun success() = SuccessGreen

    @Composable
    fun warning() = WarningOrange

    @Composable
    fun primary() = MaterialTheme.colorScheme.primary

    @Composable
    fun onPrimary() = MaterialTheme.colorScheme.onPrimary

    @Composable
    fun disabledPrimary() = MaterialTheme.colorScheme.surfaceVariant

    @Composable
    fun textMuted() = MaterialTheme.colorScheme.onSurfaceVariant
}
