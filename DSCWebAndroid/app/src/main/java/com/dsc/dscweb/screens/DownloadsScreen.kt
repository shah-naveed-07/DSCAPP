package com.dsc.dscweb.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Android
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.DesktopWindows
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dsc.dscweb.model.SystemSettings
import com.dsc.dscweb.network.NetworkResult
import com.dsc.dscweb.repository.OwnerRepository
import com.dsc.dscweb.repository.UserRepository
import com.dsc.dscweb.ui.theme.AccentEmerald
import com.dsc.dscweb.ui.theme.BorderDark
import com.dsc.dscweb.ui.theme.PrimaryCyan
import com.dsc.dscweb.ui.theme.SurfaceCard
import com.dsc.dscweb.ui.theme.SurfaceDark
import com.dsc.dscweb.ui.theme.TextMuted
import com.dsc.dscweb.ui.theme.TextPrimary
import com.dsc.dscweb.ui.theme.TextSecondary
import kotlinx.coroutines.launch

data class DownloadItem(
    val id: String,
    val title: String,
    val badge: String,
    val description: String,
    val actionText: String,
    val isComingSoon: Boolean = false,
    val actionType: String, // "FREE_PANEL", "APPS", "DOWNLOAD_CALC", "CONTACT"
    val icon: ImageVector
)

@Composable
fun DownloadsScreen(
    userRepository: UserRepository? = null,
    ownerRepository: OwnerRepository? = null,
    onNavigateFreePanel: () -> Unit = {},
    onNavigateApps: () -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var serverSettings by remember { mutableStateOf<SystemSettings?>(null) }
    var isLoadingUrl by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        if (ownerRepository != null) {
            val res = ownerRepository.getSettings()
            if (res is NetworkResult.Success) {
                serverSettings = res.data
            }
        }
    }

    fun executeDownload(plan: String = "Special") {
        val configuredUrl = serverSettings?.freeLink?.ifBlank { null }
            ?: serverSettings?.downloadLink?.ifBlank { null }
            ?: serverSettings?.apkUrl?.ifBlank { null }

        if (configuredUrl != null) {
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(configuredUrl))
                context.startActivity(intent)
            } catch (_: Exception) {
                Toast.makeText(context, "Opening link: $configuredUrl", Toast.LENGTH_LONG).show()
            }
            return
        }

        if (userRepository != null) {
            isLoadingUrl = true
            scope.launch {
                val res = userRepository.fetchDownloadUrl(plan)
                isLoadingUrl = false
                when (res) {
                    is NetworkResult.Success -> {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(res.data))
                            context.startActivity(intent)
                        } catch (_: Exception) {
                            Toast.makeText(context, "Opening link: ${res.data}", Toast.LENGTH_LONG).show()
                        }
                    }
                    is NetworkResult.Error -> {
                        Toast.makeText(context, res.message, Toast.LENGTH_LONG).show()
                    }
                    is NetworkResult.Loading -> {}
                }
            }
        } else {
            Toast.makeText(context, "Download link is controlled by backend settings.", Toast.LENGTH_SHORT).show()
        }
    }

    // Exact direct releases from DSCWeb downloads.html
    val directDownloads = listOf(
        DownloadItem(
            id = "dl_calc",
            title = "Calculator",
            badge = "Utility",
            description = "Current lightweight desktop utility for everyday productivity, math workflows, and rapid calculations.",
            actionText = "Download Now",
            actionType = "DOWNLOAD_CALC",
            icon = Icons.Default.Calculate
        ),
        DownloadItem(
            id = "dl_freepanel",
            title = "Free Panel Portal",
            badge = "Free Tier",
            description = "Instant access credentials and client binaries for verified platform access.",
            actionText = "Access Free Panel",
            actionType = "FREE_PANEL",
            icon = Icons.Default.Key
        )
    )

    // Upcoming builds & mobile tools from downloads.html
    val upcomingDownloads = listOf(
        DownloadItem(
            id = "dl_win",
            title = "Windows Utilities",
            badge = "Windows Suite",
            description = "Performance-focused desktop utilities designed for system optimization, security, and everyday use.",
            actionText = "Coming Soon",
            isComingSoon = true,
            actionType = "NONE",
            icon = Icons.Default.DesktopWindows
        ),
        DownloadItem(
            id = "dl_android",
            title = "Android Mobile Suite",
            badge = "Android Apps",
            description = "Mobile utilities including QR scanner and interactive puzzle games distributed via Google Play.",
            actionText = "Explore Apps",
            actionType = "APPS",
            icon = Icons.Default.Android
        ),
        DownloadItem(
            id = "dl_ai",
            title = "AI Automation Tools",
            badge = "AI Suite",
            description = "Future releases including intelligent productivity assistants and smart desktop automation tools.",
            actionText = "Request Updates",
            actionType = "CONTACT",
            icon = Icons.Default.Psychology
        )
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceDark),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column {
                Text(
                    text = "Download Center",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Access verified binaries, utility packages, and official software releases engineered by Dark Skull Corporation.",
                    fontSize = 13.sp,
                    color = TextMuted
                )
            }
        }

        item {
            Text(
                text = "DIRECT RELEASES",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextMuted,
                letterSpacing = 1.sp
            )
        }

        items(directDownloads) { item ->
            DownloadCard(
                item = item,
                isLoadingUrl = isLoadingUrl,
                onAction = {
                    if (item.actionType == "DOWNLOAD_CALC") {
                        executeDownload("Special")
                    } else if (item.actionType == "FREE_PANEL") {
                        onNavigateFreePanel()
                    }
                }
            )
        }

        item {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "UPCOMING BUILDS & MOBILE TOOLS",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextMuted,
                letterSpacing = 1.sp
            )
        }

        items(upcomingDownloads) { item ->
            DownloadCard(
                item = item,
                isLoadingUrl = false,
                onAction = {
                    if (item.actionType == "APPS") {
                        onNavigateApps()
                    } else if (item.actionType == "CONTACT") {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://discord.gg/darkskull"))
                            context.startActivity(intent)
                        } catch (_: Exception) {}
                    }
                }
            )
        }

        // Installation Guide from downloads.html
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(SurfaceCard)
                    .border(1.dp, BorderDark, RoundedCornerShape(14.dp))
                    .padding(16.dp)
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = PrimaryCyan,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Deployment Guidelines",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    val steps = listOf(
                        "1. Download the verified package from direct releases.",
                        "2. For Android packages, allow unknown sources in Settings if prompted.",
                        "3. Launch client and authenticate using your verified DSC credentials.",
                        "4. System configurations and update URLs sync automatically with DSCAuth."
                    )

                    steps.forEach { step ->
                        Text(
                            text = step,
                            fontSize = 12.sp,
                            color = TextSecondary,
                            modifier = Modifier.padding(vertical = 3.dp),
                            lineHeight = 17.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DownloadCard(
    item: DownloadItem,
    isLoadingUrl: Boolean,
    onAction: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(SurfaceCard)
            .border(1.dp, BorderDark, RoundedCornerShape(14.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(PrimaryCyan.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.title,
                        tint = PrimaryCyan,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.title,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = item.badge,
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = item.description,
                fontSize = 12.sp,
                color = TextSecondary,
                lineHeight = 17.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = onAction,
                enabled = !item.isComingSoon && !isLoadingUrl,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = PrimaryCyan,
                    disabledContainerColor = SurfaceDark
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                if (isLoadingUrl) {
                    CircularProgressIndicator(color = SurfaceDark, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                } else {
                    Text(
                        text = item.actionText,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (!item.isComingSoon) SurfaceDark else TextMuted
                    )
                }
            }
        }
    }
}
