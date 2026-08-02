package ai.aistroyka.shared.design

/**
 * Canonical mobile brand ARGB tokens mapped from live web
 * `apps/web/app/design-tokens.css` (--aistroyka-*).
 * Compose Color mapping lives in app themes; feature screens use semantic wrappers.
 */
object BrandTokens {
    // Surfaces
    const val BG_PAGE = 0xFF040A18L
    const val BG_SECONDARY = 0xFF0B1428L
    const val SURFACE = 0xFF101B33L
    const val SURFACE_RAISED = 0xFF16213EL
    const val SURFACE_MUTED = 0xFF1F2E4DL

    // Brand / action
    const val ACTION_PRIMARY = 0xFFF5C518L
    const val ACTION_PRIMARY_HOVER = 0xFFFFD54FL
    const val ACTION_PRIMARY_PRESSED = 0xFFE2AB00L
    const val ACTION_PRIMARY_DISABLED = 0x73FFC400L // ~45% alpha (web accent-disabled)
    /** Solid disabled primary for navy surfaces (readable construction yellow). */
    const val ACTION_PRIMARY_DISABLED_SOLID = 0xFFB89212L
    const val ACTION_PRIMARY_SOFT = 0x2EFFC400L // ~18% alpha

    // Text
    const val TEXT_PRIMARY = 0xFFF8FBFFL
    const val TEXT_SECONDARY = 0xFF9FB0CDL
    const val TEXT_TERTIARY = 0xFF6D7F9FL
    const val TEXT_ON_PRIMARY = 0xFF050B1CL

    // Borders
    const val BORDER_SUBTLE = 0xFF223250L
    const val BORDER_STRONG = 0xFF2F4771L

    // Status
    const val STATE_SUCCESS = 0xFF34C759L
    const val STATE_WARNING = 0xFFFF9500L
    const val STATE_ERROR = 0xFFFF3B30L
    const val STATE_INFO = 0xFF007AFFL

    const val BADGE_NEUTRAL_BG = 0x333C3C43L
    const val BADGE_SUCCESS_BG = 0x3334C759L
    const val BADGE_WARNING_BG = 0x33FF9500L
    const val BADGE_ERROR_BG = 0x33FF3B30L

    const val OVERLAY_DIM = 0x4D000000L

    // Spacing (dp equivalents documented for Compose)
    const val SPACE_1_DP = 4
    const val SPACE_2_DP = 8
    const val SPACE_3_DP = 12
    const val SPACE_4_DP = 16
    const val SPACE_5_DP = 20
    const val SPACE_6_DP = 24
    const val SPACE_8_DP = 32
    const val TOUCH_MIN_DP = 48
    const val RADIUS_CARD_DP = 16
    const val RADIUS_LG_DP = 10
}
