package ai.aistroyka.shared.design

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import android.provider.Settings

private val cardShape = RoundedCornerShape(BrandTokens.RADIUS_CARD_DP.dp)
private val controlShape = RoundedCornerShape(BrandTokens.RADIUS_LG_DP.dp)

enum class BrandButtonWidth { Fill, Hug, Compact }
enum class BrandBadgeTone { Neutral, Success, Warning, Error, Info }

@Composable
fun BrandPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    busy: Boolean = false,
    width: BrandButtonWidth = BrandButtonWidth.Fill,
) {
    val context = LocalContext.current
    val animatorDurationScale = Settings.Global.getFloat(
        context.contentResolver,
        Settings.Global.ANIMATOR_DURATION_SCALE,
        1f,
    )
    val reduceMotion = animatorDurationScale == 0f
    val pressScale by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(if (reduceMotion) 0 else 120),
        label = "brandPrimaryPress",
    )
    Button(
        onClick = onClick,
        enabled = enabled && !busy,
        modifier = modifier
            .then(widthModifier(width))
            .heightIn(min = BrandTokens.TOUCH_MIN_DP.dp)
            .graphicsLayer { scaleX = pressScale; scaleY = pressScale },
        shape = controlShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = BrandColors.primary(),
            contentColor = BrandColors.onPrimary(),
            disabledContainerColor = BrandColors.primaryDisabled(),
            disabledContentColor = BrandColors.onPrimary(),
        ),
        border = if (!enabled) BorderStroke(1.dp, BrandColors.primary().copy(alpha = 0.55f)) else null,
        contentPadding = PaddingValues(
            horizontal = if (width == BrandButtonWidth.Compact) BrandTokens.SPACE_3_DP.dp else BrandTokens.SPACE_4_DP.dp,
            vertical = BrandTokens.SPACE_3_DP.dp,
        ),
    ) {
        if (busy) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = BrandColors.onPrimary(),
                strokeWidth = 2.dp,
            )
        } else {
            Text(text)
        }
    }
}

@Composable
fun BrandSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    width: BrandButtonWidth = BrandButtonWidth.Fill,
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .then(widthModifier(width))
            .heightIn(min = BrandTokens.TOUCH_MIN_DP.dp),
        shape = controlShape,
        border = BorderStroke(1.dp, BrandColors.borderSubtle()),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = BrandColors.textPrimary(),
        ),
    ) {
        Text(text)
    }
}

private fun widthModifier(width: BrandButtonWidth): Modifier = when (width) {
    BrandButtonWidth.Fill -> Modifier.fillMaxWidth()
    BrandButtonWidth.Hug -> Modifier.widthIn(min = BrandTokens.TOUCH_MIN_DP.dp)
    BrandButtonWidth.Compact -> Modifier.widthIn(min = BrandTokens.TOUCH_MIN_DP.dp)
}

@Composable
fun BrandCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = cardShape,
        colors = CardDefaults.cardColors(containerColor = BrandColors.surface()),
        border = BorderStroke(1.dp, BrandColors.borderSubtle().copy(alpha = 0.8f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(
            modifier = Modifier.padding(BrandTokens.SPACE_4_DP.dp),
            verticalArrangement = Arrangement.spacedBy(BrandTokens.SPACE_2_DP.dp),
        ) {
            content()
        }
    }
}

@Composable
fun BrandOutlinedField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    singleLine: Boolean = true,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = modifier.fillMaxWidth(),
        enabled = enabled,
        singleLine = singleLine,
        visualTransformation = visualTransformation,
        shape = controlShape,
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = BrandColors.surface(),
            unfocusedContainerColor = BrandColors.surface(),
            disabledContainerColor = BrandColors.surfaceMuted(),
            focusedBorderColor = BrandColors.primary(),
            unfocusedBorderColor = BrandColors.borderSubtle(),
            focusedTextColor = BrandColors.textPrimary(),
            unfocusedTextColor = BrandColors.textPrimary(),
            focusedLabelColor = BrandColors.textMuted(),
            unfocusedLabelColor = BrandColors.textMuted(),
            cursorColor = BrandColors.primary(),
        ),
    )
}

@Composable
fun BrandBadge(text: String, tone: BrandBadgeTone = BrandBadgeTone.Neutral) {
    val fg = when (tone) {
        BrandBadgeTone.Neutral -> BrandColors.textMuted()
        BrandBadgeTone.Success -> BrandColors.success()
        BrandBadgeTone.Warning -> BrandColors.warning()
        BrandBadgeTone.Error -> BrandColors.error()
        BrandBadgeTone.Info -> BrandColors.info()
    }
    val bg = when (tone) {
        BrandBadgeTone.Neutral -> BrandColors.surfaceMuted()
        BrandBadgeTone.Success -> BrandColors.success().copy(alpha = 0.2f)
        BrandBadgeTone.Warning -> BrandColors.badgeWarningBg()
        BrandBadgeTone.Error -> BrandColors.error().copy(alpha = 0.2f)
        BrandBadgeTone.Info -> BrandColors.info().copy(alpha = 0.2f)
    }
    Text(
        text = text,
        color = fg,
        style = MaterialTheme.typography.labelMedium,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(bg)
            .padding(horizontal = BrandTokens.SPACE_2_DP.dp, vertical = BrandTokens.SPACE_1_DP.dp),
    )
}

@Composable
fun BrandEmptyState(title: String, subtitle: String? = null) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(BrandTokens.SPACE_8_DP.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(BrandTokens.SPACE_2_DP.dp),
    ) {
        Text(title, color = BrandColors.textPrimary(), style = MaterialTheme.typography.titleMedium)
        subtitle?.let {
            Text(it, color = BrandColors.textMuted(), style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun BrandErrorText(message: String) {
    Text(message, color = BrandColors.error(), style = MaterialTheme.typography.bodyMedium)
}

/**
 * Error + optional retry. [retryTitle] must be a caller-supplied localized string — no English default.
 */
@Composable
fun BrandErrorState(
    message: String,
    retryTitle: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(BrandTokens.SPACE_8_DP.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(BrandTokens.SPACE_3_DP.dp),
    ) {
        BrandErrorText(message)
        if (onRetry != null) {
            BrandSecondaryButton(
                text = retryTitle,
                onClick = onRetry,
                width = BrandButtonWidth.Hug,
            )
        }
    }
}

@Composable
fun BrandMediaFrame(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(BrandTokens.RADIUS_CARD_DP.dp))
            .background(BrandColors.surfaceMuted()),
        contentAlignment = Alignment.Center,
    ) {
        content()
    }
}

@Composable
fun BrandMutedText(text: String, style: TextStyle = MaterialTheme.typography.bodyMedium) {
    Text(text, color = BrandColors.textMuted(), style = style)
}

@Composable
fun BrandOfflineBanner(message: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(controlShape)
            .background(BrandColors.badgeWarningBg())
            .padding(BrandTokens.SPACE_3_DP.dp),
        horizontalArrangement = Arrangement.spacedBy(BrandTokens.SPACE_2_DP.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(message, color = BrandColors.warning(), style = MaterialTheme.typography.bodyMedium)
    }
}
