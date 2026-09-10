package com.dsc.dscweb.repository

import com.dsc.dscweb.auth.AuthManager
import com.dsc.dscweb.auth.JwtUtils
import com.dsc.dscweb.auth.UserRole
import com.dsc.dscweb.auth.UserSession
import com.dsc.dscweb.data.DeviceIdProvider
import com.dsc.dscweb.model.LoginRequest
import com.dsc.dscweb.model.RegisterRequest
import com.dsc.dscweb.network.DscAuthService
import com.dsc.dscweb.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository(
    private val service: DscAuthService,
    private val authManager: AuthManager,
    private val deviceIdProvider: DeviceIdProvider
) {
    suspend fun registerUser(
        username: String,
        password: String,
        key: String
    ): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val hwid = deviceIdProvider.getInternalHwid()
            val response = service.register(
                RegisterRequest(
                    username = username.trim(),
                    password = password,
                    key = key.trim(),
                    hwid = hwid
                )
            )

            if (response.isSuccessful) {
                val body = response.body()
                val token = body?.resolvedToken
                if (!token.isNullOrBlank()) {
                    val claims = JwtUtils.extractClaims(token)
                    val session = UserSession(
                        token = token,
                        username = claims.username.ifBlank { username.trim() },
                        role = UserRole.User,
                        isOwner = false,
                        expiresAt = claims.exp
                    )
                    authManager.setSession(session)
                }
                NetworkResult.Success(body?.message ?: "Registration successful! You can now sign in.")
            } else {
                val err = response.errorBody()?.string() ?: "Registration failed (${response.code()})"
                NetworkResult.Error(err, response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network connection error")
        }
    }

    suspend fun loginUser(
        username: String,
        password: String
    ): NetworkResult<UserSession> = withContext(Dispatchers.IO) {
        try {
            val hwid = deviceIdProvider.getInternalHwid()
            val response = service.loginUser(
                LoginRequest(
                    username = username.trim(),
                    password = password,
                    hwid = hwid
                )
            )

            if (response.isSuccessful) {
                val body = response.body()
                val token = body?.resolvedToken
                if (token.isNullOrBlank()) {
                    return@withContext NetworkResult.Error("No token received from authentication server.")
                }

                val claims = JwtUtils.extractClaims(token)
                if (claims.role != UserRole.User) {
                    return@withContext NetworkResult.Error("Access denied: Token is not authorized for User role.")
                }

                val session = UserSession(
                    token = token,
                    username = claims.username.ifBlank { username.trim() },
                    role = UserRole.User,
                    isOwner = false,
                    expiresAt = claims.exp
                )
                authManager.setSession(session)
                NetworkResult.Success(session)
            } else {
                val err = response.errorBody()?.string() ?: "Authentication failed (${response.code()})"
                NetworkResult.Error(err, response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network connection error")
        }
    }

    suspend fun loginAdmin(
        username: String,
        password: String
    ): NetworkResult<UserSession> = withContext(Dispatchers.IO) {
        try {
            val response = service.loginAdmin(
                LoginRequest(
                    username = username.trim(),
                    password = password
                )
            )

            if (response.isSuccessful) {
                val body = response.body()
                val token = body?.resolvedToken
                if (token.isNullOrBlank()) {
                    return@withContext NetworkResult.Error("No token returned for admin credentials.")
                }

                val claims = JwtUtils.extractClaims(token)
                if (claims.role != UserRole.Admin) {
                    return@withContext NetworkResult.Error("Unauthorized: Account does not have Admin credentials.")
                }

                // Verify owner privileges strictly via claim + probe
                var isOwner = claims.isOwner
                try {
                    val probeRes = service.ownerProbe()
                    if (probeRes.isSuccessful) {
                        isOwner = true
                    }
                } catch (_: Exception) {
                    // Fall back to claim value if probe unreachable
                }

                val session = UserSession(
                    token = token,
                    username = claims.username.ifBlank { username.trim() },
                    role = UserRole.Admin,
                    isOwner = isOwner,
                    expiresAt = claims.exp
                )
                authManager.setSession(session)
                NetworkResult.Success(session)
            } else {
                val err = response.errorBody()?.string() ?: "Admin sign-in failed (${response.code()})"
                NetworkResult.Error(err, response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network connection error")
        }
    }

    suspend fun logout() {
        authManager.logout()
    }
}
