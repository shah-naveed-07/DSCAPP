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
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Laptop
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dsc.dscweb.ui.theme.BorderDark
import com.dsc.dscweb.ui.theme.PrimaryCyan
import com.dsc.dscweb.ui.theme.SurfaceCard
import com.dsc.dscweb.ui.theme.SurfaceDark
import com.dsc.dscweb.ui.theme.TextMuted
import com.dsc.dscweb.ui.theme.TextPrimary
import com.dsc.dscweb.ui.theme.TextSecondary

data class DscAppItem(
    val id: String,
    val name: String,
    val badge: String,
    val description: String,
    val actionText: String,
    val actionUrl: String? = null,
    val isComingSoon: Boolean = false,
    val icon: ImageVector
)

@Composable
fun AppsScreen(
    onNavigateDownloads: () -> Unit = {}
) {
    val context = LocalContext.current

    fun openUrl(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            context.startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(context, "Opening link: $url", Toast.LENGTH_SHORT).show()
        }
    }

    // Exact applications from DSCWeb apps.html
    val productionApps = listOf(
        DscAppItem(
            id = "app_calc",
            name = "Calculator",
            badge = "Utility App",
            description = "Fast, compact productivity utility designed for everyday problem solving and calculation workflows.",
            actionText = "Download Tool",
            actionUrl = "DOWNLOADS",
            icon = Icons.Default.Calculate
        ),
        DscAppItem(
            id = "app_qr",
            name = "QR Scanner | Generator",
            badge = "Android Utility",
            description = "High-speed scanning and generation of QR codes. Available directly on the Google Play Store.",
            actionText = "Install on Play Store",
            actionUrl = "https://play.google.com/store/apps/details?id=com.dsc.qrscanner",
            icon = Icons.Default.QrCodeScanner
        ),
        DscAppItem(
            id = "app_matrix",
            name = "Mind Matrix (DSC Puzzle)",
            badge = "Interactive Game",
            description = "Game-inspired interaction design with a polished, modern interface and brain-teaser puzzle challenges.",
            actionText = "Install on Play Store",
            actionUrl = "https://play.google.com/store/apps/details?id=com.dsc.mindmatrix",
            icon = Icons.Default.Extension
        )
    )

    val upcomingApps = listOf(
        DscAppItem(
            id = "app_ai",
            name = "Future AI Assistant",
            badge = "AI Suite",
            description = "Intelligent workflow experiences tailored for smart automation, productivity, and developer assistance.",
            actionText = "Coming Soon",
            isComingSoon = true,
            icon = Icons.Default.Psychology
        ),
        DscAppItem(
            id = "app_desktop",
            name = "Future Desktop Tools",
            badge = "Desktop Suite",
            description = "Next-generation desktop utilities that combine speed, system performance, and trusted usability.",
            actionText = "Coming Soon",
            isComingSoon = true,
            icon = Icons.Default.Laptop
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
                    text = "Applications & Games",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Practical software built for reliable daily use. Verified software releases available for desktop workflows and Android devices.",
                    fontSize = 13.sp,
                    color = TextMuted
                )
            }
        }

        item {
            Text(
                text = "PRODUCTION RELEASES",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextMuted,
                letterSpacing = 1.sp
            )
        }

        items(productionApps) { app ->
            AppCard(app = app, onAction = { url ->
                if (url == "DOWNLOADS") {
                    onNavigateDownloads()
                } else if (url != null) {
                    openUrl(url)
                }
            })
        }

        item {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "IN DEVELOPMENT & FUTURE TOOLS",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextMuted,
                letterSpacing = 1.sp
            )
        }

        items(upcomingApps) { app ->
            AppCard(app = app, onAction = {})
        }
    }
}

@Composable
private fun AppCard(
    app: DscAppItem,
    onAction: (String?) -> Unit
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
                        imageVector = app.icon,
                        contentDescription = app.name,
                        tint = PrimaryCyan,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = app.name,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = app.badge,
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = app.description,
                fontSize = 12.sp,
                color = TextSecondary,
                lineHeight = 17.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = { onAction(app.actionUrl) },
                enabled = !app.isComingSoon,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = PrimaryCyan,
                    disabledContainerColor = SurfaceDark
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = app.actionText,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (!app.isComingSoon) SurfaceDark else TextMuted
                )
            }
        }
    }
}
