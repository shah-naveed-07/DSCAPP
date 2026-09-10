package com.dsc.dscweb.actions

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.navigation.NavController
import com.dsc.dscweb.auth.UserSession
import com.dsc.dscweb.navigation.Screen

class ActionExecutor(
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
        onRequireConfirmation: (AssistantAction, String) -> Unit = { _, _ -> }
    ): ActionResult {
        val action = ActionRegistry.allActions.find { it.id == actionId }
            ?: return ActionResult.Error("Action '$actionId' not recognized.")

        // 1. Permission check
        if (!ActionRegistry.validatePermission(actionId, session)) {
            val roleName = session?.role?.name ?: "Guest"
            val msg = if (action.requiresOwner) {
                "Sir, this requires Owner clearance. Aapke paas Owner permission nahi hai."
            } else {
                "Sir, this requires ${action.requiredRole.name} privileges. Current session ($roleName) is not authorized."
            }
            return ActionResult.PermissionDenied(msg)
        }

        // 2. Confirmation check for destructive actions
        if (action.isDestructive && !confirmed) {
            val prompt = action.confirmationPrompt ?: "Are you sure you want to proceed with this action?"
            onRequireConfirmation(action, prompt)
            return ActionResult.RequiresConfirmation(action, prompt)
        }

        // 3. Execution
        return when (actionId) {
            "nav_home" -> {
                navController.navigate(Screen.Home.route)
                ActionResult.Success("Navigating to DSC Hub.", "Home screen open kar diya hai.")
            }
            "nav_apps" -> {
                navController.navigate(Screen.Apps.route)
                ActionResult.Success("Navigating to Applications.", "Apps screen open kar diya hai.")
            }
            "nav_products" -> {
                navController.navigate(Screen.Products.route)
                ActionResult.Success("Navigating to VIP Plans.", "VIP Plans display kar raha hoon.")
            }
            "nav_free_panel" -> {
                navController.navigate(Screen.FreePanel.route)
                ActionResult.Success("Opening Free Panel.", "Free panel open ho gaya hai.")
            }
            "nav_downloads" -> {
                navController.navigate(Screen.Downloads.route)
                ActionResult.Success("Navigating to Downloads.", "Downloads screen open ho gaya hai.")
            }
            "nav_login" -> {
                navController.navigate(Screen.UserLogin.route)
                ActionResult.Success("Opening Sign In.", "Login page khol diya hai.")
            }
            "nav_register" -> {
                navController.navigate(Screen.UserRegister.route)
                ActionResult.Success("Opening Registration.", "Registration page open kar diya hai.")
            }
            "nav_admin" -> {
                navController.navigate(Screen.AdminDashboard.route)
                ActionResult.Success("Opening Admin Command.", "Admin Command panel khol diya hai.")
            }
            "nav_owner" -> {
                navController.navigate(Screen.OwnerControlCenter.route)
                ActionResult.Success("Opening Owner Control Center.", "Owner Control Center open kar diya hai.")
            }
            "user_copy_key" -> {
                onCopyKeyRequested()
                ActionResult.Success("License key copied.", "Aapka license key clipboard par copy kar diya gaya hai.")
            }
            "user_change_pass" -> {
                onChangePasswordRequested()
                ActionResult.Success("Opening password dialog.", "Password change dialog open kar diya hai.")
            }
            "user_logout" -> {
                onLogoutRequested()
                ActionResult.Success("Signed out successfully.", "Aapka session logout kar diya gaya hai.")
            }
            else -> ActionResult.Success("Action executed: ${action.title}")
        }
    }
}
