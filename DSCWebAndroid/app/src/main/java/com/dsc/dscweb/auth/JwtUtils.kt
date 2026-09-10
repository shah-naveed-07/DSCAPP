package com.dsc.dscweb.auth

import android.util.Base64
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.nio.charset.StandardCharsets

data class JwtClaims(
    val username: String = "",
    val role: UserRole = UserRole.User,
    val isOwner: Boolean = false,
    val exp: Long? = null
)

object JwtUtils {
    private val gson = Gson()

    fun extractClaims(token: String?): JwtClaims {
        if (token.isNullOrBlank()) return JwtClaims()

        try {
            val parts = token.split(".")
            if (parts.size < 2) return JwtClaims()

            var payloadBase64 = parts[1]
                .replace('-', '+')
                .replace('_', '/')
            val padding = payloadBase64.length % 4
            if (padding > 0) {
                payloadBase64 += "=".repeat(4 - padding)
            }

            val decodedBytes = Base64.decode(payloadBase64, Base64.URL_SAFE or Base64.NO_WRAP)
            val jsonString = String(decodedBytes, StandardCharsets.UTF_8)

            val type = object : TypeToken<Map<String, Any>>() {}.type
            val map: Map<String, Any> = gson.fromJson(jsonString, type) ?: return JwtClaims()

            // Username extraction
            val username = (map["username"] as? String)
                ?: (map["sub"] as? String)
                ?: (map["name"] as? String)
                ?: (map["unique_name"] as? String)
                ?: (map["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] as? String)
                ?: ""

            // Role extraction
            val rawRole = (map["role"] as? String)
                ?: ((map["roles"] as? List<*>)?.firstOrNull() as? String)
                ?: (map["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as? String)
                ?: ""

            val roleLower = rawRole.lowercase()
            val role = when {
                roleLower == "admin" || roleLower == "owner" -> UserRole.Admin
                roleLower == "user" -> UserRole.User
                else -> UserRole.User
            }

            // Owner extraction (NEVER determined by username!)
            val isOwner = (map["isOwner"] as? Boolean) == true
                    || (map["owner"] as? Boolean) == true
                    || (map["is_owner"] as? Boolean) == true
                    || roleLower == "owner"

            val exp = (map["exp"] as? Number)?.toLong()

            return JwtClaims(
                username = username,
                role = role,
                isOwner = isOwner,
                exp = exp
            )
        } catch (_: Exception) {
            return JwtClaims()
        }
    }
}
