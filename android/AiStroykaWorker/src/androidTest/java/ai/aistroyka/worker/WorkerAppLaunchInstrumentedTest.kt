package ai.aistroyka.worker

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Smoke instrumented check: Worker activity + Compose root mount.
 * Login fields must expose Maestro resource ids (`pilot_worker_*`).
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

    @Test
    fun loginScreenExposesPilotTags() {
        composeRule.waitForIdle()
        composeRule.onNodeWithTag("pilot_worker_email").assertIsDisplayed()
        composeRule.onNodeWithTag("pilot_worker_password").assertIsDisplayed()
        composeRule.onNodeWithTag("pilot_worker_sign_in").assertIsDisplayed()
    }
}
