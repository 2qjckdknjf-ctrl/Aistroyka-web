package ai.aistroyka.worker

import ai.aistroyka.shared.PushRegistrationService
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Receives FCM token updates and registers with the API when the user is signed in.
 * Do not log message payloads or tokens.
 */
class WorkerFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        PushRegistrationService.saveToken(token)
        PushRegistrationService.registerIfNeeded()
    }

    override fun onMessageReceived(message: RemoteMessage) {
        // Display / deep-link handling can be added later; keep worker surface minimal.
    }
}
