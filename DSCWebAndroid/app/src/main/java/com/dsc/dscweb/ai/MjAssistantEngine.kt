package com.dsc.dscweb.ai

import com.dsc.dscweb.actions.ActionExecutor
import com.dsc.dscweb.actions.ActionResult
import com.dsc.dscweb.actions.AssistantAction
import com.dsc.dscweb.auth.UserSession

data class MjMessage(
    val id: String = System.currentTimeMillis().toString(),
    val sender: String, // "user" or "mj"
    val text: String,
    val actionId: String? = null,
    val isPendingConfirmation: Boolean = false,
    val pendingAction: AssistantAction? = null
)

class MjAssistantEngine(
    private val actionExecutor: ActionExecutor
) {
    fun processQuery(
        query: String,
        currentRoute: String?,
        session: UserSession?,
        onResponse: (MjMessage, String?) -> Unit,
        onRequireConfirmation: (AssistantAction, String) -> Unit
    ) {
        val q = query.trim().lowercase()

        // 1. Check greetings
        if (q in listOf("hi", "hello", "hey", "namaste", "kaise ho", "kya haal hai", "mj")) {
            val reply = "Hello sir! Main MJ hoon. DSC security operations aur dashboard navigation mein aapki kaise madad kar sakta hoon?"
            onResponse(MjMessage(sender = "mj", text = reply), reply)
            return
        }

        // 2. Intent matching
        val matchedActionId = resolveIntent(q)

        if (matchedActionId != null) {
            val result = actionExecutor.execute(
                actionId = matchedActionId,
                session = session,
                confirmed = false,
                onRequireConfirmation = onRequireConfirmation
            )

            when (result) {
                is ActionResult.Success -> {
                    val speech = result.speechResponse ?: result.message
                    onResponse(
                        MjMessage(sender = "mj", text = result.message, actionId = matchedActionId),
                        speech
                    )
                }
                is ActionResult.PermissionDenied -> {
                    onResponse(
                        MjMessage(sender = "mj", text = result.reason),
                        result.reason
                    )
                }
                is ActionResult.RequiresConfirmation -> {
                    val promptText = "Sir, yeh action destructive hai. ${result.prompt}"
                    onResponse(
                        MjMessage(
                            sender = "mj",
                            text = promptText,
                            isPendingConfirmation = true,
                            pendingAction = result.action
                        ),
                        promptText
                    )
                }
                is ActionResult.Error -> {
                    onResponse(
                        MjMessage(sender = "mj", text = result.message),
                        result.message
                    )
                }
            }
        } else {
            // Contextual advice based on current screen
            val screenCtx = ScreenSemanticRegistry.getContextForRoute(currentRoute)
            val fallback = "Main aapki request '${query}' par kaam kar raha hoon. Aap ${screenCtx.title} par hain. Niche diye gaye suggestions try kar sakte hain."
            onResponse(MjMessage(sender = "mj", text = fallback), fallback)
        }
    }

    private fun resolveIntent(query: String): String? {
        return when {
            // Free Panel
            query.contains("free panel") || query.contains("free slot") || query.contains("free key") || query.contains("free pass") -> "nav_free_panel"

            // Products & Plans
            query.contains("vip") || query.contains("plan") || query.contains("price") || query.contains("pricing") || query.contains("tier") || query.contains("silver") || query.contains("gold") || query.contains("platinum") -> "nav_products"

            // Apps & Security tools
            query.contains("app") || query.contains("tool") || query.contains("bypass") || query.contains("inject") || query.contains("features") -> "nav_apps"

            // Downloads
            query.contains("download") || query.contains("apk") || query.contains("install") || query.contains("link") -> "nav_downloads"

            // Navigation Hub
            query.contains("home") || query.contains("hub") || query.contains("dashboard") && !query.contains("admin") && !query.contains("owner") -> "nav_home"

            // Auth
            query.contains("login") || query.contains("sign in") -> "nav_login"
            query.contains("register") || query.contains("sign up") || query.contains("account banao") -> "nav_register"

            // User Actions
            query.contains("copy key") || query.contains("key copy") || query.contains("license key") || query.contains("mera key") -> "user_copy_key"
            query.contains("change pass") || query.contains("password change") || query.contains("password badlo") -> "user_change_pass"
            query.contains("expiry") || query.contains("validity") || query.contains("kab khatam") -> "user_check_expiry"
            query.contains("logout") || query.contains("sign out") || query.contains("bahar jao") -> "user_logout"

            // Admin
            query.contains("admin") || query.contains("staff") || query.contains("user search") || query.contains("orders check") -> "nav_admin"

            // Owner
            query.contains("owner") || query.contains("database") || query.contains("master panel") -> "nav_owner"
            query.contains("key generate") || query.contains("generate key") || query.contains("nayi key") || query.contains("key banao") -> "owner_create_key"
            query.contains("maintenance") -> "owner_toggle_maintenance"

            else -> null
        }
    }
}
