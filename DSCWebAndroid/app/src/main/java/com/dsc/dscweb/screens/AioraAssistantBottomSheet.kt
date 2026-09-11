package com.dsc.dscweb.screens

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.dsc.dscweb.actions.AioraAction
import com.dsc.dscweb.ai.AioraAssistantEngine
import com.dsc.dscweb.ai.AioraMessage
import com.dsc.dscweb.ai.AioraVoiceManager
import com.dsc.dscweb.ai.AioraVoiceState
import com.dsc.dscweb.ai.ScreenSemanticRegistry
import com.dsc.dscweb.auth.UserSession
import com.dsc.dscweb.ui.theme.AccentEmerald
import com.dsc.dscweb.ui.theme.AccentRose
import com.dsc.dscweb.ui.theme.BorderDark
import com.dsc.dscweb.ui.theme.BorderSubtle
import com.dsc.dscweb.ui.theme.PrimaryCyan
import com.dsc.dscweb.ui.theme.SecondaryPurple
import com.dsc.dscweb.ui.theme.SurfaceCard
import com.dsc.dscweb.ui.theme.SurfaceDark
import com.dsc.dscweb.ui.theme.TextMuted
import com.dsc.dscweb.ui.theme.TextPrimary
import com.dsc.dscweb.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AioraAssistantBottomSheet(
    sheetState: SheetState,
    currentRoute: String?,
    session: UserSession?,
    aioraEngine: AioraAssistantEngine,
    voiceManager: AioraVoiceManager,
    onDismiss: () -> Unit,
    onExecuteActionConfirmed: (AioraAction) -> Unit
) {
    val context = LocalContext.current
    val voiceState by voiceManager.voiceState.collectAsState()
    var inputText by remember { mutableStateOf("") }
    val messages = remember {
        mutableStateListOf(
            AioraMessage(
                sender = "aiora",
                text = "Hi, I'm Aiora. How can I help you navigate DSC Security Operations?"
            )
        )
    }

    val screenCtx = remember(currentRoute) {
        ScreenSemanticRegistry.getContextForRoute(currentRoute)
    }

    fun submitQuery(queryText: String) {
        if (queryText.isBlank()) return
        messages.add(AioraMessage(sender = "user", text = queryText))
        inputText = ""

        aioraEngine.processQuery(
            query = queryText,
            history = messages.toList(),
            currentRoute = currentRoute,
            session = session,
            onResponse = { msg, speech ->
                messages.add(msg)
                if (speech != null) {
                    voiceManager.speak(speech)
                }
            },
            onRequireConfirmation = { _, _ -> }
        )
    }

    // Runtime Permission Launcher for RECORD_AUDIO
    val micPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            voiceManager.startListening { spoken ->
                submitQuery(spoken)
            }
        } else {
            Toast.makeText(
                context,
                "Microphone permission is required for Aiora voice commands.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    fun toggleVoiceListening() {
        if (voiceState == AioraVoiceState.Listening) {
            voiceManager.stopListening()
        } else {
            val hasPermission = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED

            if (hasPermission) {
                voiceManager.startListening { spoken ->
                    submitQuery(spoken)
                }
            } else {
                micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            }
        }
    }

    ModalBottomSheet(
        onDismissRequest = {
            voiceManager.stopSpeaking()
            voiceManager.stopListening()
            onDismiss()
        },
        sheetState = sheetState,
        containerColor = SurfaceDark,
        dragHandle = null
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.88f)
                .padding(bottom = 16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(PrimaryCyan.copy(alpha = 0.15f))
                        .border(1.dp, PrimaryCyan.copy(alpha = 0.5f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = "Aiora",
                        tint = PrimaryCyan,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Aiora",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        // Status badge
                        val statusText = when (voiceState) {
                            AioraVoiceState.Listening -> "Aiora is listening..."
                            AioraVoiceState.Thinking -> "Aiora is thinking..."
                            AioraVoiceState.Speaking -> "Aiora is speaking..."
                            AioraVoiceState.Idle -> "Online"
                        }
                        val statusColor = when (voiceState) {
                            AioraVoiceState.Listening -> AccentRose
                            AioraVoiceState.Thinking -> SecondaryPurple
                            AioraVoiceState.Speaking -> AccentEmerald
                            AioraVoiceState.Idle -> PrimaryCyan
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(statusColor.copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = statusText,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = statusColor
                            )
                        }
                    }
                    Text(
                        text = "Intelligent Operations Assistant",
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                }

                Spacer(modifier = Modifier.weight(1f))

                IconButton(
                    onClick = {
                        voiceManager.stopSpeaking()
                        voiceManager.stopListening()
                        onDismiss()
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = TextMuted
                    )
                }
            }

            // Screen Context Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 4.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(SurfaceCard)
                    .border(1.dp, BorderSubtle, RoundedCornerShape(10.dp))
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Active Screen: ${screenCtx.title}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = PrimaryCyan
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    if (voiceState == AioraVoiceState.Speaking) {
                        IconButton(
                            onClick = { voiceManager.stopSpeaking() },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.VolumeUp,
                                contentDescription = "Mute",
                                tint = PrimaryCyan,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            // Message List
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(messages) { msg ->
                    if (msg.sender == "user") {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(PrimaryCyan.copy(alpha = 0.2f))
                                    .border(1.dp, PrimaryCyan.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
                                    .padding(horizontal = 14.dp, vertical = 10.dp)
                            ) {
                                Text(
                                    text = msg.text,
                                    color = TextPrimary,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Start
                        ) {
                            Column {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(SurfaceCard)
                                        .border(1.dp, BorderDark, RoundedCornerShape(14.dp))
                                        .padding(horizontal = 14.dp, vertical = 10.dp)
                                ) {
                                    Text(
                                        text = msg.text,
                                        color = TextPrimary,
                                        fontSize = 13.sp,
                                        lineHeight = 18.sp
                                    )
                                }

                                // Destructive confirmation action prompt inside chat
                                if (msg.isPendingConfirmation && msg.pendingAction != null) {
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = {
                                                onExecuteActionConfirmed(msg.pendingAction)
                                                messages.add(
                                                    AioraMessage(
                                                        sender = "aiora",
                                                        text = "Action '${msg.pendingAction.title}' confirmed and executed."
                                                    )
                                                )
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = AccentRose),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Text("Confirm Action", fontSize = 12.sp, color = TextPrimary)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Quick Chips
            FlowRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                screenCtx.suggestedChips.forEach { chip ->
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(SurfaceCard)
                            .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                            .clickable { submitQuery(chip) }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = chip,
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Input Row + Mic button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("Ask Aiora anything...", color = TextMuted, fontSize = 13.sp) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(24.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = SurfaceCard,
                        unfocusedContainerColor = SurfaceCard,
                        focusedBorderColor = PrimaryCyan,
                        unfocusedBorderColor = BorderDark,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = { submitQuery(inputText) }),
                    singleLine = true
                )

                Spacer(modifier = Modifier.width(8.dp))

                // Voice Mic Button (With Runtime Permission Check & Native Dialog)
                val isMicActive = voiceState == AioraVoiceState.Listening
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(if (isMicActive) AccentRose else SurfaceCard)
                        .border(1.dp, if (isMicActive) AccentRose else BorderDark, CircleShape)
                        .clickable { toggleVoiceListening() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isMicActive) Icons.Default.MicOff else Icons.Default.Mic,
                        contentDescription = "Voice Input",
                        tint = if (isMicActive) TextPrimary else PrimaryCyan,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Spacer(modifier = Modifier.width(6.dp))

                // Send Button
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(PrimaryCyan)
                        .clickable { submitQuery(inputText) },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send",
                        tint = SurfaceDark,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}
