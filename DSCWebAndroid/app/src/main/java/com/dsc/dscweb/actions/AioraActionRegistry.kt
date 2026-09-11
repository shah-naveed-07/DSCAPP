package com.dsc.dscweb.actions

import com.dsc.dscweb.auth.UserRole
import com.dsc.dscweb.auth.UserSession

data class AioraAction(
    val id: String,
    val title: String,
    val requiredRole: UserRole,
    val requiresOwner: Boolean = false,
    val isDestructive: Boolean = false,
    val confirmationPrompt: String? = null,
    val description: String = ""
)

sealed class AioraActionResult {
    data class Success(val message: String, val speechResponse: String? = null) : AioraActionResult()
    data class PermissionDenied(val reason: String) : AioraActionResult()
    data class RequiresConfirmation(val action: AioraAction, val prompt: String) : AioraActionResult()
    data class Error(val message: String) : AioraActionResult()
}

object AioraActionRegistry {
    val allActions: List<AioraAction> = listOf(
        // Navigation Actions
        AioraAction("OPEN_HOME", "Open Home", UserRole.Guest, description = "Navigate to DSC Hub"),
        AioraAction("OPEN_APPS", "Open Applications", UserRole.Guest, description = "Browse native applications"),
        AioraAction("OPEN_PRODUCTS", "Open VIP Plans", UserRole.Guest, description = "View subscription tiers"),
        AioraAction("OPEN_FREE_PANEL", "Open Free Panel", UserRole.Guest, description = "Access temporary free slots"),
        AioraAction("OPEN_DOWNLOADS", "Open Downloads", UserRole.Guest, description = "Download tools and assets"),
        AioraAction("OPEN_LOGIN", "Sign In", UserRole.Guest, description = "Open sign in screen"),
        AioraAction("OPEN_REGISTER", "Create Account", UserRole.Guest, description = "Open registration screen"),
        AioraAction("OPEN_USER_DASHBOARD", "Open User Portal", UserRole.User, description = "Open subscriber dashboard"),

        // User Actions
        AioraAction("USER_COPY_KEY", "Copy License Key", UserRole.User, description = "Copy active key to clipboard"),
        AioraAction("USER_CHANGE_PASS", "Change Password", UserRole.User, description = "Open change password dialog"),
        AioraAction("USER_CHECK_EXPIRY", "Check Expiry", UserRole.User, description = "Check active plan expiration"),
        AioraAction("USER_LOGOUT", "Sign Out", UserRole.User, isDestructive = true, confirmationPrompt = "Kya aap session logout karna chahte hain?", description = "End current session"),

        // Admin Actions
        AioraAction("OPEN_ADMIN_DASHBOARD", "Open Admin Command", UserRole.Admin, description = "Access Admin Dashboard"),
        AioraAction("ADMIN_SEARCH_USER", "Search User", UserRole.Admin, description = "Search user database"),
        AioraAction("ADMIN_APPROVE_ORDER", "Approve Order", UserRole.Admin, isDestructive = true, confirmationPrompt = "Is order ko approve karein?", description = "Approve pending order"),
        AioraAction("ADMIN_BAN_USER", "Ban User", UserRole.Admin, isDestructive = true, confirmationPrompt = "Kya aap is user ko ban karna chahte hain?", description = "Suspend user account"),

        // Owner Actions
        AioraAction("OPEN_OWNER_CENTER", "Open Owner Control", UserRole.Admin, requiresOwner = true, description = "Access Owner Control Center"),
        AioraAction("OWNER_CREATE_KEY", "Generate License Key", UserRole.Admin, requiresOwner = true, description = "Create new VIP license key"),
        AioraAction("OWNER_TOGGLE_MAINTENANCE", "Toggle Maintenance", UserRole.Admin, requiresOwner = true, isDestructive = true, confirmationPrompt = "Maintenance mode toggle karein? Sabhi users affect honge.", description = "Toggle global maintenance"),
        AioraAction("OWNER_DELETE_USER", "Delete User", UserRole.Admin, requiresOwner = true, isDestructive = true, confirmationPrompt = "Kya aap user ko database se permanently delete karna chahte hain?", description = "Permanently remove user record")
    )

    fun validatePermission(actionId: String, session: UserSession?): Boolean {
        val action = allActions.find { it.id == actionId } ?: return false
        val role = session?.role ?: UserRole.Guest

        if (action.requiresOwner) {
            return role == UserRole.Admin && session?.isOwner == true
        }

        return when (action.requiredRole) {
            UserRole.Guest -> true
            UserRole.User -> role == UserRole.User || role == UserRole.Admin
            UserRole.Admin -> role == UserRole.Admin
        }
    }
}
