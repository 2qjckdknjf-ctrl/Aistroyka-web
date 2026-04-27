package ai.aistroyka.manager.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable

object ManagerSemanticColors {
    @Composable
    fun pageBackground() = MaterialTheme.colorScheme.background

    @Composable
    fun error() = MaterialTheme.colorScheme.error

    @Composable
    fun primary() = MaterialTheme.colorScheme.primary

    @Composable
    fun onPrimary() = MaterialTheme.colorScheme.onPrimary

    @Composable
    fun disabledPrimary() = MaterialTheme.colorScheme.surfaceVariant

    @Composable
    fun textMuted() = MaterialTheme.colorScheme.onSurfaceVariant
}
