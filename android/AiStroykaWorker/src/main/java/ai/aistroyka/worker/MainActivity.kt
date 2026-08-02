package ai.aistroyka.worker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import ai.aistroyka.shared.design.DesignPreviewApp
import ai.aistroyka.shared.design.DesignPreviewScreen
import ai.aistroyka.worker.ui.AiStroykaWorkerTheme
import ai.aistroyka.worker.ui.WorkerApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val preview = DesignPreviewScreen.fromId(intent?.getStringExtra("design_preview"))
        setContent {
            if (preview != null) {
                AiStroykaWorkerTheme {
                    DesignPreviewApp(
                        screen = preview,
                        appTitle = "AiStroyka Worker",
                        brandMarkResId = R.drawable.aistroyka_helmet,
                    )
                }
            } else {
                WorkerApp()
            }
        }
    }
}
