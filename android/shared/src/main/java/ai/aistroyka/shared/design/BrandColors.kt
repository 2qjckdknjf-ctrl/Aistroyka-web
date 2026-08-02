package ai.aistroyka.shared.design

import androidx.compose.ui.graphics.Color

/** Compose Color accessors for BrandTokens — single source for Manager + Worker. */
object BrandColors {
    fun pageBackground() = Color(BrandTokens.BG_PAGE)
    fun bgSecondary() = Color(BrandTokens.BG_SECONDARY)
    fun surface() = Color(BrandTokens.SURFACE)
    fun surfaceMuted() = Color(BrandTokens.SURFACE_MUTED)
    fun surfaceRaised() = Color(BrandTokens.SURFACE_RAISED)
    fun borderSubtle() = Color(BrandTokens.BORDER_SUBTLE)
    fun primary() = Color(BrandTokens.ACTION_PRIMARY)
    fun primaryDisabled() = Color(BrandTokens.ACTION_PRIMARY_DISABLED_SOLID)
    fun onPrimary() = Color(BrandTokens.TEXT_ON_PRIMARY)
    fun textPrimary() = Color(BrandTokens.TEXT_PRIMARY)
    fun textMuted() = Color(BrandTokens.TEXT_SECONDARY)
    fun textTertiary() = Color(BrandTokens.TEXT_TERTIARY)
    fun error() = Color(BrandTokens.STATE_ERROR)
    fun success() = Color(BrandTokens.STATE_SUCCESS)
    fun warning() = Color(BrandTokens.STATE_WARNING)
    fun info() = Color(BrandTokens.STATE_INFO)
    fun overlayDim() = Color(BrandTokens.OVERLAY_DIM)
    fun badgeWarningBg() = Color(BrandTokens.BADGE_WARNING_BG)
}
