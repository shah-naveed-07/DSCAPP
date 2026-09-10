package com.dsc.dscweb.auth

enum class UserRole {
    Guest,
    User,
    Admin
}

data class UserSession(
    val token: String,
    val username: String,
    val role: UserRole,
    val isOwner: Boolean = false,
    val expiresAt: Long? = null
) {
    val isExpired: Boolean
        get() = expiresAt != null && expiresAt * 1000 < System.currentTimeMillis()

    val canAccessAdmin: Boolean
        get() = role == UserRole.Admin

    val canAccessOwner: Boolean
        get() = role == UserRole.Admin && isOwner
}
