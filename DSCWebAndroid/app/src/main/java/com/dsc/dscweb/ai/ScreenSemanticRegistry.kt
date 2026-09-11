package com.dsc.dscweb.ai

import com.dsc.dscweb.navigation.Screen

data class ScreenContext(
    val title: String,
    val description: String,
    val suggestedChips: List<String>
)

object ScreenSemanticRegistry {
    fun getContextForRoute(route: String?): ScreenContext {
        return when (route) {
            Screen.Home.route -> ScreenContext(
                title = "DSC Hub",
                description = "Dark Skull Corporation main hub with system metrics and operational shortcuts.",
                suggestedChips = listOf("Free panel kholo", "Plans dikhao", "Downloads screen", "App list dikhao")
            )
            Screen.Apps.route -> ScreenContext(
                title = "Applications",
                description = "Suite of native DSC applications and server-managed services.",
                suggestedChips = listOf("Downloads kholo", "Plans dikhao", "Home screen jao")
            )
            Screen.Products.route -> ScreenContext(
                title = "Subscriptions & Plans",
                description = "Official subscription tiers: Streamer, Sniper, Special, Aimbot, Premium, Customised.",
                suggestedChips = listOf("Special Plan details", "Checkout process", "Free panel kholo")
            )
            Screen.FreePanel.route -> ScreenContext(
                title = "Free Panel",
                description = "Daily shared access credentials dispenser and remaining slot counts.",
                suggestedChips = listOf("Credentials copy karo", "Slots remaining", "Plans dikhao")
            )
            Screen.Downloads.route -> ScreenContext(
                title = "Official Downloads",
                description = "Verified client binaries and mobile tools from backend settings.",
                suggestedChips = listOf("Download APK", "Installation guide", "Home screen")
            )
            Screen.UserDashboard.route -> ScreenContext(
                title = "User Portal",
                description = "Active subscription details, license key, expiration, and password settings.",
                suggestedChips = listOf("Mera license key copy karo", "Expiry kab hai?", "Password change karo", "Logout karo")
            )
            Screen.AdminDashboard.route -> ScreenContext(
                title = "Admin Command",
                description = "Staff portal for subscriber records, pending orders, user management, and staff tools.",
                suggestedChips = listOf("Pending orders check karo", "User search", "Staff password update")
            )
            Screen.OwnerControlCenter.route -> ScreenContext(
                title = "Owner Control Center",
                description = "Master control center for Global UserPass, download links, license keys, admin accounts, free users, and maintenance.",
                suggestedChips = listOf("Global UserPass settings", "Download links check", "New key generate karo", "Admins list dikhao")
            )
            else -> ScreenContext(
                title = "DSC Workspace",
                description = "Dark Skull Corporation native workspace.",
                suggestedChips = listOf("Free panel kholo", "Login screen", "Downloads", "Ask Aiora")
            )
        }
    }
}
