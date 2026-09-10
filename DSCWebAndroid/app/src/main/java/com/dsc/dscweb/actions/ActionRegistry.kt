package com.dsc.dscweb.actions

import com.dsc.dscweb.auth.UserRole
import com.dsc.dscweb.auth.UserSession

data class AssistantAction(
    val id: String,
    val title: String,
    val requiredRole: UserRole,
    val requiresOwner: Boolean = false,
    val isDestructive: Boolean = false,
    val confirmationPrompt: String? = null,
    val description: String = ""
)

sealed class ActionResult {
    data class Success(val message: String, val speechResponse: String? = null) : ActionResult()
    data class PermissionDenied(val reason: String) : ActionResult()
    data class RequiresConfirmation(val action: AssistantAction, val prompt: String) : ActionResult()
    data class Error(val message: String) : ActionResult()
}

object ActionRegistry {
    val allActions: List<AssistantAction> = listOf(
        // Public / Navigation Actions
        AssistantAction("nav_home", "Open Home", UserRole.Guest, description = "Navigate to DSC Hub"),
        AssistantAction("nav_apps", "Open Applications", UserRole.Guest, description = "Browse native applications"),
        AssistantAction("nav_products", "Open VIP Plans", UserRole.Guest, description = "View subscription tiers"),
        AssistantAction("nav_free_panel", "Open Free Panel", UserRole.Guest, description = "Access temporary free slots"),
        AssistantAction("nav_downloads", "Open Downloads", UserRole.Guest, description = "Download tools and assets"),
        AssistantAction("nav_login", "Sign In", UserRole.Guest, description = "Open sign in screen"),
        AssistantAction("nav_register", "Create Account", UserRole.Guest, description = "Open registration screen"),

        // User Actions
        AssistantAction("user_copy_key", "Copy License Key", UserRole.User, description = "Copy active key to clipboard"),
        AssistantAction("user_change_pass", "Change Password", UserRole.User, description = "Open change password dialog"),
        AssistantAction("user_check_expiry", "Check Expiry", UserRole.User, description = "Check active plan expiration"),
        AssistantAction("user_logout", "Sign Out", UserRole.User, isDestructive = true, confirmationPrompt = "Kya aap session logout karna chahte hain?", description = "End current session"),

        // Admin Actions
        AssistantAction("nav_admin", "Open Admin Command", UserRole.Admin, description = "Access Admin Dashboard"),
        AssistantAction("admin_search_user", "Search User", UserRole.Admin, description = "Search user database"),
        AssistantAction("admin_approve_order", "Approve Order", UserRole.Admin, isDestructive = true, confirmationPrompt = "Is order ko approve karein?", description = "Approve pending order"),
        AssistantAction("admin_ban_user", "Ban User", UserRole.Admin, isDestructive = true, confirmationPrompt = "Kya aap is user ko ban karna chahte hain?", description = "Suspend user account"),

        // Owner Actions
        AssistantAction("nav_owner", "Open Owner Control", UserRole.Admin, requiresOwner = true, description = "Access Owner Control Center"),
        AssistantAction("owner_create_key", "Generate License Key", UserRole.Admin, requiresOwner = true, description = "Create new VIP license key"),
        AssistantAction("owner_toggle_maintenance", "Toggle Maintenance", UserRole.Admin, requiresOwner = true, isDestructive = true, confirmationPrompt = "Maintenance mode toggle karein? Sabhi users affect honge.", description = "Toggle global maintenance"),
        AssistantAction("owner_delete_user", "Delete User", UserRole.Admin, requiresOwner = true, isDestructive = true, confirmationPrompt = "Kya aap user ko database se permanently delete karna chahte hain?", description = "Permanently remove user record")
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
