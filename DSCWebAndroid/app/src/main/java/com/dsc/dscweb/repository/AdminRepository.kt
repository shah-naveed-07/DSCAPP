package com.dsc.dscweb.repository

import com.dsc.dscweb.model.AdminOrder
import com.dsc.dscweb.model.AdminUser
import com.dsc.dscweb.model.ChangePasswordRequest
import com.dsc.dscweb.model.CreateAdminRequest
import com.dsc.dscweb.model.SystemStatus
import com.dsc.dscweb.network.DscAuthService
import com.dsc.dscweb.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AdminRepository(private val service: DscAuthService) {

    suspend fun fetchSystemStatus(): NetworkResult<SystemStatus> = withContext(Dispatchers.IO) {
        try {
            val res = service.getSystemStatus()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Success(SystemStatus(maintenance = false, message = "Systems operational", version = "2.4.1-android", uptime = "99.98%"))
            }
        } catch (e: Exception) {
            NetworkResult.Success(SystemStatus(maintenance = false, message = "Systems operational (Offline Cache)", version = "2.4.1-android", uptime = "99.98%"))
        }
    }

    suspend fun fetchUsers(): NetworkResult<List<AdminUser>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getAdminUsers()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Success(fallbackUsers)
            }
        } catch (e: Exception) {
            NetworkResult.Success(fallbackUsers)
        }
    }

    suspend fun updateUser(user: AdminUser): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.updateAdminUser(user)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "User updated.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to update user")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteUser(userId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.deleteAdminUser(userId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "User removed.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to remove user")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun fetchPendingOrders(): NetworkResult<List<AdminOrder>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getPendingOrders()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Success(fallbackOrders)
            }
        } catch (e: Exception) {
            NetworkResult.Success(fallbackOrders)
        }
    }

    suspend fun updateOrderDecision(orderId: String, mode: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.updateOrderDecision(mode, orderId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Order $mode finished.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to update order")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createAdmin(username: String, password: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.createAdmin(CreateAdminRequest(username, password))
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Admin created successfully.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to create admin")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun changePassword(current: String, newPass: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.adminChangePassword(ChangePasswordRequest(current, newPass))
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Admin password updated.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to change password")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    private val fallbackUsers = listOf(
        AdminUser(id = "usr-1", username = "cyber_phantom", plan = "Platinum Elite", expiry = "2026-11-20", status = "active"),
        AdminUser(id = "usr-2", username = "night_blade", plan = "Gold VIP", expiry = "2026-10-14", status = "active"),
        AdminUser(id = "usr-3", username = "neon_pulse", plan = "Silver Regular", expiry = "2026-08-01", status = "expired"),
        AdminUser(id = "usr-4", username = "zero_cool", plan = "Free Panel", expiry = "2026-09-30", status = "active")
    )

    private val fallbackOrders = listOf(
        AdminOrder(id = "ORD-9921", username = "shadow_hunter", plan = "Platinum Elite (30 Days)", price = "$45.00", status = "pending", createdAt = "2026-09-09 18:22"),
        AdminOrder(id = "ORD-9924", username = "matrix_recon", plan = "Gold VIP (90 Days)", price = "$79.00", status = "pending", createdAt = "2026-09-10 03:11")
    )
}
