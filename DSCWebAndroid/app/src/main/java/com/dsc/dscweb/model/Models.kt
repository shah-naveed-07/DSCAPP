package com.dsc.dscweb.model

import com.google.gson.annotations.SerializedName

// -------------------------------------------------------------------------
// User & Order Models
// -------------------------------------------------------------------------
data class UserOrder(
    val username: String = "",
    val plan: String = "FREE-PANEL",
    val expiry: String = "",
    val status: String = "Active",
    val key: String? = null,
    val orderId: String = "",
    val createdAt: String = ""
)

data class FreePanelInfo(
    val available: Boolean = true,
    @SerializedName("freeUser") val username: String = "",
    @SerializedName("freePass") val password: String = "",
    @SerializedName("usedSlots") val usedSlots: Int = 0,
    @SerializedName("maxSlots") val totalSlots: Int = 50,
    @SerializedName("freeLink") val downloadUrl: String = "",
    val message: String = ""
) {
    val remainingSlots: Int
        get() = (totalSlots - usedSlots).coerceAtLeast(0)

    val progress: Int
        get() = if (totalSlots > 0) ((usedSlots.toFloat() / totalSlots) * 100).toInt().coerceIn(0, 100) else 0
}

data class DownloadUrlResponse(
    val url: String? = null,
    val message: String? = null
)

// -------------------------------------------------------------------------
// Admin Models
// -------------------------------------------------------------------------
data class AdminUser(
    val id: String = "",
    val username: String = "",
    val plan: String = "FREE-PANEL",
    val expiry: String = "",
    val status: String = "active",
    val hwid: String? = null,
    val createdAt: String = ""
) {
    val isBanned: Boolean
        get() = status.equals("banned", ignoreCase = true) || status.equals("suspended", ignoreCase = true)
}

data class AdminOrder(
    val id: String = "",
    val username: String = "",
    val discordId: String? = null,
    val plan: String = "",
    val days: Int = 30,
    val price: String = "",
    val amount: String = "",
    val txnId: String? = null,
    val status: String = "pending", // pending, approved, rejected
    val paymentProof: String? = null,
    val createdAt: String = ""
)

data class AdminKey(
    val id: String = "",
    @SerializedName("keyValue") val key: String = "",
    val plan: String = "",
    val validDays: Int = 30,
    @SerializedName("isUsed") val isUsed: Boolean = false,
    val status: String = "unused", // unused, used, revoked
    val usedBy: String? = null,
    val createdAt: String = ""
) {
    val durationDays: Int
        get() = validDays
}

data class AdminAccount(
    val id: String = "",
    val username: String = "",
    val role: String = "Admin",
    val isActive: Boolean = true,
    val isOwner: Boolean = false,
    val createdAt: String = ""
)

// -------------------------------------------------------------------------
// Owner & System Configuration Models
// -------------------------------------------------------------------------
data class SystemSettings(
    val id: String? = null,
    val registrationOpen: Boolean = true,
    val freePanelActive: Boolean = true,
    val defaultDurationDays: Int = 30,
    @SerializedName("showHomeDownloadBtn") val showHomeDownloadBtn: Boolean = false,
    @SerializedName("freeUsername") val freeUsername: String = "",
    @SerializedName("freePassword") val freePassword: String = "",
    @SerializedName("maxFreeSlots") val maxFreeSlots: Int = 50,
    @SerializedName("freeValidDays") val freeValidDays: Int = 30,
    @SerializedName("freeLink") val freeLink: String = "",
    @SerializedName("streamerLink") val streamerLink: String = "",
    @SerializedName("sniperLink") val sniperLink: String = "",
    @SerializedName("specialLink") val specialLink: String = "",
    @SerializedName("aimbotLink") val aimbotLink: String = "",
    @SerializedName("premiumLink") val premiumLink: String = "",
    @SerializedName("customisedLink") val customisedLink: String = "",
    val downloadLink: String = "",
    val apkUrl: String = "",
    @SerializedName("latestVersion") val latestVersion: String = "",
    @SerializedName("updateUrl") val updateUrl: String = "",
    val maintenance: Boolean = false,
    @SerializedName("isMaintenanceMode") val isMaintenanceMode: Boolean = false,
    @SerializedName("maintenanceReason") val maintenanceReason: String = "",
    val announcement: String = "",
    val supportDiscord: String = "https://discord.gg/darkskull",
    val supportTelegram: String = "https://t.me/dscofficial"
)

data class SystemStatus(
    val maintenance: Boolean = false,
    val message: String = "Systems operational",
    val version: String = "1.0.0-native",
    val uptime: String = "99.98%"
)

data class FreeUserRecord(
    val id: String = "",
    @SerializedName("username") val username: String = "",
    @SerializedName("hwid") val hwid: String? = null,
    @SerializedName("envName") val envName: String? = null,
    @SerializedName("isBanned") val isBanned: Boolean = false,
    @SerializedName("failedLoginAttempts") val failedLoginAttempts: Int = 0,
    @SerializedName("firstLoginTime") val firstLoginTime: String = "",
    @SerializedName("lastLoginTime") val lastLoginTime: String = ""
)

data class PanelUpdateRecord(
    @SerializedName("update1") val update1: String = "Aimbot Status: Undetected",
    @SerializedName("update2") val update2: String = "Sniper Status: Undetected",
    @SerializedName("update3") val update3: String = "Bypass Status: Safe",
    @SerializedName("update4") val update4: String = "General Status: Operational"
)

data class PanelUpdateRequest(
    @SerializedName("update1") val update1: String,
    @SerializedName("update2") val update2: String,
    @SerializedName("update3") val update3: String,
    @SerializedName("update4") val update4: String
)

// -------------------------------------------------------------------------
// Auth Request & Response DTOs
// -------------------------------------------------------------------------
data class RegisterRequest(
    val username: String,
    val password: String,
    val key: String,
    val hwid: String
)

data class LoginRequest(
    val username: String,
    val password: String,
    val hwid: String? = null
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

data class CheckoutRequest(
    val username: String,
    val passwordHash: String, // Plaintext password as expected by backend checkout
    val discordId: String? = null,
    val plan: String = "",
    val days: Int = 30,
    val amount: String = "",
    val txnId: String? = null,
    val paymentProofBase64: String? = null
)

data class CreateAdminRequest(
    val username: String,
    val password: String
)

data class CreateKeyRequest(
    @SerializedName("Plan") val plan: String,
    @SerializedName("ValidDays") val durationDays: Int
)

data class AuthResponse(
    val token: String? = null,
    @SerializedName("Token") val tokenUpper: String? = null,
    val role: String? = null,
    val message: String? = null,
    val code: String? = null
) {
    val resolvedToken: String?
        get() = token ?: tokenUpper
}

data class GenericMessageResponse(
    val message: String? = null,
    val success: Boolean? = null,
    val maintenance: Boolean? = null,
    val isMaintenanceMode: Boolean? = null
)
