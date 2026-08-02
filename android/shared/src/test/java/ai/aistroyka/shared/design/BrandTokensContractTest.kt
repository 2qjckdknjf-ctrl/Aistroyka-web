package ai.aistroyka.shared.design

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Contract test: Manager/Worker must not fork BrandTokens ARGB values.
 * If a per-app BrandComponents copy reappears, CI/unit coverage of BrandColors
 * still binds both apps to this shared palette.
 */
class BrandTokensContractTest {
    @Test
    fun pageBackground_isDeepNavy() {
        assertEquals(0xFF040A18L, BrandTokens.BG_PAGE)
    }

    @Test
    fun primaryAction_isConstructionYellow() {
        assertEquals(0xFFF5C518L, BrandTokens.ACTION_PRIMARY)
    }

    @Test
    fun onPrimary_isNearBlackInverse() {
        assertEquals(0xFF050B1CL, BrandTokens.TEXT_ON_PRIMARY)
    }

    @Test
    fun disabledPrimarySolid_isReadableYellow() {
        assertEquals(0xFFB89212L, BrandTokens.ACTION_PRIMARY_DISABLED_SOLID)
    }

    @Test
    fun touchTarget_meetsAndroidMinimum() {
        assertEquals(48, BrandTokens.TOUCH_MIN_DP)
    }

    @Test
    fun buttonWidthEnum_coversFillHugCompact() {
        assertEquals(3, BrandButtonWidth.entries.size)
        assertEquals(BrandButtonWidth.Fill, BrandButtonWidth.entries[0])
        assertEquals(BrandButtonWidth.Hug, BrandButtonWidth.entries[1])
        assertEquals(BrandButtonWidth.Compact, BrandButtonWidth.entries[2])
    }
}
