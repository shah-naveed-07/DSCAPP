package com.dsc.dscweb.navigation

sealed class Screen(val route: String, val title: String) {
    data object Home : Screen("home", "DSC Hub")
    data object Apps : Screen("apps", "Applications")
    data object Products : Screen("products", "VIP Plans")
    data object FreePanel : Screen("free_panel", "Free Panel")
    data object Downloads : Screen("downloads", "Downloads")
    data object UserLogin : Screen("user_login", "User Login")
    data object UserRegister : Screen("user_register", "Register")
    data object UserDashboard : Screen("user_dashboard", "User Portal")
    data object AdminLogin : Screen("admin_login", "Staff Access")
    data object AdminDashboard : Screen("admin_dashboard", "Admin Command")
    data object OwnerControlCenter : Screen("owner_control", "Owner Center")

    companion object {
        val bottomNavItems = listOf(Home, Apps, Products, FreePanel, Downloads)

        fun fromRoute(route: String?): Screen {
            return when (route) {
                Home.route -> Home
                Apps.route -> Apps
                Products.route -> Products
                FreePanel.route -> FreePanel
                Downloads.route -> Downloads
                UserLogin.route -> UserLogin
                UserRegister.route -> UserRegister
                UserDashboard.route -> UserDashboard
                AdminLogin.route -> AdminLogin
                AdminDashboard.route -> AdminDashboard
                OwnerControlCenter.route -> OwnerControlCenter
                else -> Home
            }
        }
    }
}
