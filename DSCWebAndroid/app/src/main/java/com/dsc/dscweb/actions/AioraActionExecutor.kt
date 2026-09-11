package com.dsc.dscweb.actions

import android.content.Context
import androidx.navigation.NavController
import com.dsc.dscweb.auth.UserSession
import com.dsc.dscweb.navigation.Screen

class AioraActionExecutor(
    private val context: Context,
    private val navController: NavController,
    private val onLogoutRequested: () -> Unit,
    private val onCopyKeyRequested: () -> Unit,
    private val onChangePasswordRequested: () -> Unit
) {
    fun execute(
        actionId: String,
        session: UserSession?,
        confirmed: Boolean = false,
        onRequireConfirmation: (AioraAction, String) -> Unit = { _, _ -> }
    ): AioraActionResult {
        val action = AioraActionRegistry.allActions.find { it.id == actionId }
            ?: return AioraActionResult.Error("Action '$actionId' not recognized.")

        // Permission check
        if (!AioraActionRegistry.validatePermission(actionId, session)) {
            val roleName = session?.role?.name ?: "Guest"
            val msg = if (action.requiresOwner) {
                "Sir, this requires Owner clearance. Aapke paas Owner permission nahi hai."
            } else {
                "Sir, this requires ${action.requiredRole.name} privileges. Current session ($roleName) is not authorized."
            }
            return AioraActionResult.PermissionDenied(msg)
        }

        // Confirmation check for destructive actions
        if (action.isDestructive && !confirmed) {
            val prompt = action.confirmationPrompt ?: "Are you sure you want to proceed with this action?"
            onRequireConfirmation(action, prompt)
            return AioraActionResult.RequiresConfirmation(action, prompt)
        }

        // Execution
        return when (actionId) {
            "OPEN_HOME", "nav_home" -> {
                navController.navigate(Screen.Home.route)
                AioraActionResult.Success("Navigating to DSC Hub.", "Home screen open kar diya hai.")
            }
            "OPEN_APPS", "nav_apps" -> {
                navController.navigate(Screen.Apps.route)
                AioraActionResult.Success("Navigating to Applications.", "Apps screen open kar diya hai.")
            }
            "OPEN_PRODUCTS", "nav_products" -> {
                navController.navigate(Screen.Products.route)
                AioraActionResult.Success("Navigating to VIP Plans.", "VIP Plans display kar raha hoon.")
            }
            "OPEN_FREE_PANEL", "nav_free_panel" -> {
                navController.navigate(Screen.FreePanel.route)
                AioraActionResult.Success("Opening Free Panel.", "Free panel open ho gaya hai.")
            }
            "OPEN_DOWNLOADS", "nav_downloads" -> {
                navController.navigate(Screen.Downloads.route)
                AioraActionResult.Success("Navigating to Downloads.", "Downloads screen open ho gaya hai.")
            }
            "OPEN_LOGIN", "nav_login" -> {
                navController.navigate(Screen.UserLogin.route)
                AioraActionResult.Success("Opening Sign In.", "Login page khol diya hai.")
            }
            "OPEN_REGISTER", "nav_register" -> {
                navController.navigate(Screen.UserRegister.route)
                AioraActionResult.Success("Opening Registration.", "Registration page open kar diya hai.")
            }
            "OPEN_USER_DASHBOARD", "nav_user_dashboard" -> {
                navController.navigate(Screen.UserDashboard.route)
                AioraActionResult.Success("Opening User Portal.", "User Portal open kar diya hai.")
            }
            "OPEN_ADMIN_DASHBOARD", "nav_admin" -> {
                navController.navigate(Screen.AdminDashboard.route)
                AioraActionResult.Success("Opening Admin Command.", "Admin Command panel khol diya hai.")
            }
            "OPEN_OWNER_CENTER", "nav_owner" -> {
                navController.navigate(Screen.OwnerControlCenter.route)
                AioraActionResult.Success("Opening Owner Control Center.", "Owner Control Center open kar diya hai.")
            }
            "USER_COPY_KEY", "user_copy_key" -> {
                onCopyKeyRequested()
                AioraActionResult.Success("License key copied.", "Aapka license key clipboard par copy kar diya gaya hai.")
            }
            "USER_CHANGE_PASS", "user_change_pass" -> {
                onChangePasswordRequested()
                AioraActionResult.Success("Opening password dialog.", "Password change dialog open kar diya hai.")
            }
            "USER_LOGOUT", "user_logout" -> {
                onLogoutRequested()
                AioraActionResult.Success("Signed out successfully.", "Aapka session logout kar diya gaya hai.")
            }
            else -> AioraActionResult.Success("Action executed: ${action.title}")
        }
    }
}
