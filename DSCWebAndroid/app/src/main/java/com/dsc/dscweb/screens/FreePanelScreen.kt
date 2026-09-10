package com.dsc.dscweb.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dsc.dscweb.model.FreePanelInfo
import com.dsc.dscweb.repository.PublicRepository
import com.dsc.dscweb.ui.theme.AccentEmerald
import com.dsc.dscweb.ui.theme.BorderDark
import com.dsc.dscweb.ui.theme.PrimaryCyan
import com.dsc.dscweb.ui.theme.SurfaceCard
import com.dsc.dscweb.ui.theme.SurfaceDark
import com.dsc.dscweb.ui.theme.TextMuted
import com.dsc.dscweb.ui.theme.TextPrimary
import com.dsc.dscweb.ui.theme.TextSecondary
import kotlinx.coroutines.launch

@Composable
fun FreePanelScreen(
    publicRepository: PublicRepository
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var freeInfo by remember { mutableStateOf<FreePanelInfo?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    fun loadData() {
        scope.launch {
            isLoading = true
            val result = publicRepository.getFreePanelInfo()
            freeInfo = result.getOrNull()
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    fun copyToClipboard(label: String, text: String) {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText(label, text)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(context, "$label copied to clipboard!", Toast.LENGTH_SHORT).show()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceDark)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Public Free Panel",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Daily shared access credentials provided by DSC.",
                        fontSize = 13.sp,
                        color = TextMuted
                    )
                }

                OutlinedButton(
                    onClick = { loadData() },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh",
                        tint = PrimaryCyan,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        if (isLoading && freeInfo == null) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = PrimaryCyan)
                }
            }
        } else {
            val info = freeInfo ?: FreePanelInfo(
                username = "dsc_free_user",
                password = "DSC_FreePass_2026",
                remainingSlots = 14,
                totalSlots = 50,
                progress = 72
            )

            // Slot availability card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(SurfaceCard)
                        .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                        .padding(20.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Slot Availability",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            Text(
                                text = "${info.remainingSlots} / ${info.totalSlots} Slots Remaining",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = AccentEmerald
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        val progressFraction = (info.progress / 100f).coerceIn(0f, 1f)
                        LinearProgressIndicator(
                            progress = progressFraction,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = PrimaryCyan,
                            trackColor = SurfaceDark
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "Slots are dynamically cycled and flushed every 24 hours.",
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                    }
                }
            }

            // Credentials dispenser card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(SurfaceCard)
                        .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                        .padding(20.dp)
                ) {
                    Column {
                        Text(
                            text = "Active Free Credentials",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        CredentialRow(
                            label = "Username",
                            value = info.username,
                            onCopy = { copyToClipboard("Free Username", info.username) }
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        CredentialRow(
                            label = "Password",
                            value = info.password,
                            onCopy = { copyToClipboard("Free Password", info.password) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CredentialRow(
    label: String,
    value: String,
    onCopy: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(SurfaceDark)
            .border(1.dp, BorderDark, RoundedCornerShape(10.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = label, fontSize = 10.sp, color = TextMuted)
            Text(
                text = value,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = PrimaryCyan
            )
        }

        Button(
            onClick = onCopy,
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan.copy(alpha = 0.15f)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.ContentCopy,
                contentDescription = "Copy",
                tint = PrimaryCyan,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text("Copy", color = PrimaryCyan, fontSize = 12.sp)
        }
    }
}
