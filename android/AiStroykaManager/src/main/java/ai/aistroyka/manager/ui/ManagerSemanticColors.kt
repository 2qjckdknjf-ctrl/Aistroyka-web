package ai.aistroyka.manager.ui

import ai.aistroyka.shared.design.BrandColors
import androidx.compose.runtime.Composable

/** App alias → shared BrandColors (prevents Manager/Worker palette drift). */
object ManagerSemanticColors {
    @Composable fun pageBackground() = BrandColors.pageBackground()
    @Composable fun surface() = BrandColors.surface()
    @Composable fun surfaceMuted() = BrandColors.surfaceMuted()
    @Composable fun surfaceRaised() = BrandColors.surfaceRaised()
    @Composable fun borderSubtle() = BrandColors.borderSubtle()
    @Composable fun primary() = BrandColors.primary()
    @Composable fun onPrimary() = BrandColors.onPrimary()
    @Composable fun disabledPrimary() = BrandColors.primaryDisabled()
    @Composable fun textPrimary() = BrandColors.textPrimary()
    @Composable fun textMuted() = BrandColors.textMuted()
    @Composable fun textTertiary() = BrandColors.textTertiary()
    @Composable fun error() = BrandColors.error()
    @Composable fun success() = BrandColors.success()
    @Composable fun warning() = BrandColors.warning()
    @Composable fun info() = BrandColors.info()
    @Composable fun overlayDim() = BrandColors.overlayDim()
    @Composable fun badgeWarningBg() = BrandColors.badgeWarningBg()
}
