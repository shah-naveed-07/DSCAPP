package com.dsc.dscweb.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.ShoppingCart
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
import com.dsc.dscweb.navigation.Screen
import com.dsc.dscweb.ui.theme.BorderDark
import com.dsc.dscweb.ui.theme.PrimaryCyan
import com.dsc.dscweb.ui.theme.SurfaceDark
import com.dsc.dscweb.ui.theme.TextMuted
import com.dsc.dscweb.ui.theme.TextPrimary

@Composable
fun DscBottomNavBar(
    currentRoute: String?,
    onNavigate: (Screen) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(64.dp)
            .background(SurfaceDark)
            .border(1.dp, BorderDark)
            .padding(horizontal = 4.dp),
        horizontalArrangement = Arrangement.SpaceAround,
        verticalAlignment = Alignment.CenterVertically
    ) {
        val items = listOf(
            Triple(Screen.Home, "Hub", Icons.Default.Home),
            Triple(Screen.Apps, "Apps", Icons.Default.Apps),
            Triple(Screen.Products, "VIP", Icons.Default.ShoppingCart),
            Triple(Screen.FreePanel, "Free", Icons.Default.Key),
            Triple(Screen.Downloads, "Files", Icons.Default.Download)
        )

        items.forEach { (screen, label, icon) ->
            val isSelected = currentRoute == screen.route

            Column(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable { onNavigate(screen) }
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = if (isSelected) PrimaryCyan else TextMuted,
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = label,
                    fontSize = 11.sp,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (isSelected) PrimaryCyan else TextMuted
                )
            }
        }
    }
}
