package ai.aistroyka.worker

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Smoke instrumented check: Worker activity + Compose root mount.
 * Full submit/report flows belong in Maestro or higher-level E2E.
 */
@RunWith(AndroidJUnit4::class)
class WorkerAppLaunchInstrumentedTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun activityStarts_andComposeRootExists() {
        composeRule.waitForIdle()
        composeRule.onRoot().assertExists()
    }
}
