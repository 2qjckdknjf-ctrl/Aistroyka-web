package ai.aistroyka.manager

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Smoke instrumented check: Manager activity + Compose root mount.
 * Mirrors WorkerAppLaunchInstrumentedTest. Full intelligence/copilot/report
 * flows belong in the iOS/Manager live pilot E2E layer, not this launch smoke.
 */
@RunWith(AndroidJUnit4::class)
class ManagerAppLaunchInstrumentedTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun activityStarts_andComposeRootExists() {
        composeRule.waitForIdle()
        composeRule.onRoot().assertExists()
    }
}
