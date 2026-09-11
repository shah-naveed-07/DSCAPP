package com.dsc.dscweb.model

import com.google.gson.annotations.SerializedName

// -------------------------------------------------------------------------
// User & Order Models
// -------------------------------------------------------------------------
data class UserOrder(
    val username: String = "",
    val plan: String = "VIP Plan",
    val expiry: String = "",
    val status: String = "Active",
    val key: String? = null,
    val orderId: String = "",
    val createdAt: String = ""
)

data class FreePanelInfo(
    val available: Boolean = true,
    val username: String = "",
    val password: String = "",
    val remainingSlots: Int = 0,
    val totalSlots: Int = 0,
    val progress: Int = 0,
    val downloadUrl: String = "",
    val message: String = ""
)

// -------------------------------------------------------------------------
// Admin Models
// -------------------------------------------------------------------------
data class AdminUser(
    val id: String = "",
    val username: String = "",
    val plan: String = "Standard VIP",
    val expiry: String = "",
    val status: String = "active",
    val hwid: String? = null,
    val createdAt: String = ""
) {
    val isBanned: Boolean
        get() = status.equals("banned", ignoreCase = true) || status.equals("suspended", ignoreCase = true)
}

typealias UserRecord = AdminUser
typealias Order = AdminOrder
typealias KeyRecord = AdminKey

data class UserPassSettings(
    val username: String = "dsc_free_user",
    val password: String = "DSC_FreePass_2026",
    val totalSlots: Int = 50
)

data class AdminOrder(
    val id: String = "",
    val username: String = "",
    val plan: String = "",
    val price: String = "",
    val status: String = "pending", // pending, approved, rejected
    val paymentProof: String? = null,
    val createdAt: String = ""
)

data class AdminKey(
    val id: String = "",
    val key: String = "",
    val plan: String = "",
    val durationDays: Int = 30,
    val status: String = "unused", // unused, used, revoked
    val usedBy: String? = null,
    val createdAt: String = ""
)

data class AdminAccount(
    val id: String = "",
    val username: String = "",
    val role: String = "Admin",
    val isOwner: Boolean = false,
    val createdAt: String = ""
)

// -------------------------------------------------------------------------
// Owner & System Configuration Models
// -------------------------------------------------------------------------
data class SystemSettings(
    val registrationOpen: Boolean = true,
    val freePanelActive: Boolean = true,
    val defaultDurationDays: Int = 30,
    val showHomeDownloadBtn: Boolean = false,
    val freeLink: String = "",
    val downloadLink: String = "",
    val apkUrl: String = "",
    val maintenance: Boolean = false,
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
    val username: String = "",
    val hwid: String? = null,
    val captchaToken: String? = null,
    val isBanned: Boolean = false,
    val failedLoginAttempts: Int = 0,
    val firstLoginTime: String = "",
    val lastLoginTime: String = ""
)

data class PanelUpdate(
    val version: String = "",
    val releaseNotes: String = "",
    val downloadUrl: String = "",
    val releaseDate: String = ""
)

data class PanelStatusUpdate(
    val update1: String = "Operational (v3.5)",
    val update2: String = "Updated (Safe)",
    val update3: String = "Kernel Bypass Active",
    val update4: String = "All Systems Normal"
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

data class CreateAdminRequest(
    val username: String,
    val password: String
)

data class CreateKeyRequest(
    val plan: String,
    val durationDays: Int
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
    val maintenance: Boolean? = null
)
