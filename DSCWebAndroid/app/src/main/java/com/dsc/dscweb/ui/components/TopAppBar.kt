package com.dsc.dscweb.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dsc.dscweb.auth.UserRole
import com.dsc.dscweb.auth.UserSession
import com.dsc.dscweb.ui.theme.BorderDark
import com.dsc.dscweb.ui.theme.PrimaryCyan
import com.dsc.dscweb.ui.theme.SecondaryPurple
import com.dsc.dscweb.ui.theme.SurfaceCard
import com.dsc.dscweb.ui.theme.SurfaceDark
import com.dsc.dscweb.ui.theme.TextMuted
import com.dsc.dscweb.ui.theme.TextPrimary

@Composable
fun DscTopAppBar(
    currentTitle: String,
    session: UserSession?,
    onOpenAiora: () -> Unit,
    onNavigateUserPortal: () -> Unit,
    onNavigateStaffPortal: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(60.dp)
            .background(SurfaceDark)
            .border(1.dp, BorderDark)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Logo
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(SurfaceCard)
                .border(1.dp, BorderDark, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Shield,
                contentDescription = "DSC Logo",
                tint = PrimaryCyan,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(10.dp))

        // Title
        Text(
            text = "DSC",
            fontWeight = FontWeight.Black,
            fontSize = 18.sp,
            color = TextPrimary
        )
        Text(
            text = "WEB",
            fontWeight = FontWeight.Light,
            fontSize = 18.sp,
            color = PrimaryCyan
        )
        if (currentTitle.isNotBlank()) {
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "• $currentTitle",
                fontSize = 12.sp,
                fontWeight = FontWeight.Normal,
                color = TextMuted
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        // Role indicator / Session shortcut
        if (session != null) {
            val roleLabel = when {
                session.isOwner -> "OWNER"
                session.role == UserRole.Admin -> "ADMIN"
                else -> "VIP"
            }
            val badgeColor = if (session.isOwner) SecondaryPurple else PrimaryCyan

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(badgeColor.copy(alpha = 0.15f))
                    .border(1.dp, badgeColor.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                    .clickable {
                        if (session.role == UserRole.Admin) onNavigateStaffPortal() else onNavigateUserPortal()
                    }
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = roleLabel,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = badgeColor
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        // Ask Aiora Button
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(SurfaceCard)
                .border(1.dp, PrimaryCyan.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
                .clickable { onOpenAiora() }
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = "Ask Aiora",
                tint = PrimaryCyan,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "Ask Aiora",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
        }
    }
}
