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
                description = "Dark Skull Corporation main hub with system metrics and fast shortcuts.",
                suggestedChips = listOf("Free panel kholo", "VIP plans dikhao", "Downloads screen", "App list dikhao")
            )
            Screen.Apps.route -> ScreenContext(
                title = "Applications",
                description = "Suite of DSC security tools, injectors, bypass modules and status trackers.",
                suggestedChips = listOf("Bypass safe hai kya?", "Downloads kholo", "Home screen jao")
            )
            Screen.Products.route -> ScreenContext(
                title = "VIP Plans & Pricing",
                description = "Official subscription tiers: Silver, Gold, Platinum Elite.",
                suggestedChips = listOf("Gold VIP details", "Platinum features", "Checkout process")
            )
            Screen.FreePanel.route -> ScreenContext(
                title = "Free Panel",
                description = "Daily public slots with credential dispenser and remaining slot counts.",
                suggestedChips = listOf("Credentials copy karo", "Slots remaining", "VIP upgrade karo")
            )
            Screen.Downloads.route -> ScreenContext(
                title = "Downloads",
                description = "Official binaries, native APKs, and installation guides.",
                suggestedChips = listOf("Latest APK link", "Installation guide", "Home screen")
            )
            Screen.UserDashboard.route -> ScreenContext(
                title = "User Portal",
                description = "Active subscription details, license key, expiry countdown, and credential settings.",
                suggestedChips = listOf("Mera license key copy karo", "Mera expiry kab hai?", "Password change karo", "Logout karo")
            )
            Screen.AdminDashboard.route -> ScreenContext(
                title = "Admin Command",
                description = "Staff portal for system telemetry, subscriber records, order verification, and staff tools.",
                suggestedChips = listOf("Pending orders check karo", "User search", "System uptime", "Staff password update")
            )
            Screen.OwnerControlCenter.route -> ScreenContext(
                title = "Owner Control Center",
                description = "Highest privileged master panel for license creation, admin roles, maintenance, and server updates.",
                suggestedChips = listOf("New VIP key generate karo", "Maintenance mode check", "Admins list dikhao", "Global UserPass settings")
            )
            else -> ScreenContext(
                title = "DSC Workspace",
                description = "Dark Skull Corporation native workspace.",
                suggestedChips = listOf("Free panel kholo", "Login screen", "Downloads", "Ask MJ")
            )
        }
    }
}
