package ai.aistroyka.manager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import ai.aistroyka.manager.ui.AiStroykaManagerTheme
import ai.aistroyka.manager.ui.ManagerApp
import ai.aistroyka.shared.design.DesignPreviewApp
import ai.aistroyka.shared.design.DesignPreviewScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val preview = DesignPreviewScreen.fromId(intent?.getStringExtra("design_preview"))
        setContent {
            if (preview != null) {
                AiStroykaManagerTheme {
                    DesignPreviewApp(
                        screen = preview,
                        appTitle = "AiStroyka Manager",
                        brandMarkResId = R.drawable.aistroyka_helmet,
                    )
                }
            } else {
                ManagerApp()
            }
        }
    }
}
