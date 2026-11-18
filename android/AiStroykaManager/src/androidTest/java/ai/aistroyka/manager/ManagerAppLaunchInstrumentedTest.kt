package ai.aistroyka.manager

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Smoke instrumented check: Manager activity + Compose root mount.
 * Login fields must stay tappable (first-launch guide must not cover them).
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

    @Test
    fun loginScreenExposesPilotTags() {
        composeRule.waitForIdle()
        composeRule.onNodeWithTag("pilot_manager_email").assertIsDisplayed()
        composeRule.onNodeWithTag("pilot_manager_password").assertIsDisplayed()
        composeRule.onNodeWithTag("pilot_manager_sign_in").assertIsDisplayed()
    }
}
