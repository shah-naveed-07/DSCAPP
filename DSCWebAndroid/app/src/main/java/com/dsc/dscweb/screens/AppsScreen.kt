package com.dsc.dscweb.screens

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.VpnKey
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dsc.dscweb.ui.theme.AccentEmerald
import com.dsc.dscweb.ui.theme.BorderDark
import com.dsc.dscweb.ui.theme.PrimaryCyan
import com.dsc.dscweb.ui.theme.SecondaryPurple
import com.dsc.dscweb.ui.theme.SurfaceCard
import com.dsc.dscweb.ui.theme.SurfaceDark
import com.dsc.dscweb.ui.theme.TextMuted
import com.dsc.dscweb.ui.theme.TextPrimary
import com.dsc.dscweb.ui.theme.TextSecondary

data class DscAppItem(
    val id: String,
    val name: String,
    val version: String,
    val status: String,
    val description: String,
    val icon: ImageVector
)

@Composable
fun AppsScreen() {
    val apps = listOf(
        DscAppItem(
            id = "app_bypass",
            name = "DSC Kernel Bypass",
            version = "v3.5.2",
            status = "Operational (Safe)",
            description = "Ring-0 kernel memory hook bypass with dynamic signature masking and zero trace execution.",
            icon = Icons.Default.Security
        ),
        DscAppItem(
            id = "app_memguard",
            name = "Memory Guard Module",
            version = "v2.8.0",
            status = "Active",
            description = "Protects real-time game process memory addresses against heuristic background scanners.",
            icon = Icons.Default.Memory
        ),
        DscAppItem(
            id = "app_hwid",
            name = "HWID Synchronizer",
            version = "v1.9.4",
            status = "Synchronized",
            description = "Hardware identifier binding service connecting directly with DSCAuth backend without client exposure.",
            icon = Icons.Default.VpnKey
        ),
        DscAppItem(
            id = "app_injector",
            name = "Zero-Trace Injection Engine",
            version = "v4.1.0",
            status = "Undetected",
            description = "High-speed process injector supporting Android 9 through Android 14 architectures.",
            icon = Icons.Default.Speed
        )
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceDark)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Column {
                Text(
                    text = "Security Tools & Applications",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "All native modules are synchronized with the active DSCAuth server.",
                    fontSize = 13.sp,
                    color = TextMuted
                )
            }
        }

        items(apps) { app ->
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
                                text = app.version,
                                fontSize = 11.sp,
                                color = TextMuted
                            )
                        }

                        // Status pill
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(AccentEmerald.copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = app.status,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = AccentEmerald
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
                }
            }
        }
    }
}
