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
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to fetch system status (${res.code()})", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error fetching system status")
        }
    }

    suspend fun fetchUsers(): NetworkResult<List<AdminUser>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getAdminUsers()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to fetch users list (${res.code()})", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error fetching users")
        }
    }

    suspend fun updateUser(user: AdminUser): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.updateAdminUser(user)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "User updated.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to update user", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error updating user")
        }
    }

    suspend fun banUser(user: AdminUser): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.banAdminUser(user)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "User ban status updated.")
            } else {
                updateUser(user)
            }
        } catch (_: Exception) {
            updateUser(user)
        }
    }

    suspend fun deleteUser(userId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.deleteAdminUser(userId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "User removed.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to remove user", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error removing user")
        }
    }

    suspend fun fetchPendingOrders(): NetworkResult<List<AdminOrder>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getPendingOrders()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to fetch pending orders (${res.code()})", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error fetching pending orders")
        }
    }

    suspend fun fetchAllOrders(): NetworkResult<List<AdminOrder>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getAllOrders()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                fetchPendingOrders()
            }
        } catch (_: Exception) {
            fetchPendingOrders()
        }
    }

    suspend fun fetchOrders(): NetworkResult<List<AdminOrder>> = fetchPendingOrders()

    suspend fun setUserBanned(username: String, banned: Boolean): NetworkResult<String> = withContext(Dispatchers.IO) {
        val userRes = fetchUsers()
        val user = userRes.getOrNull()?.find { it.username.equals(username, ignoreCase = true) }
        val updated = (user ?: AdminUser(username = username)).copy(status = if (banned) "banned" else "active")
        banUser(updated)
    }

    suspend fun approveOrder(orderId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.approveOrder(orderId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Order approved.")
            } else {
                updateOrderDecision(orderId, "approve")
            }
        } catch (_: Exception) {
            updateOrderDecision(orderId, "approve")
        }
    }

    suspend fun rejectOrder(orderId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.rejectOrder(orderId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Order rejected.")
            } else {
                updateOrderDecision(orderId, "reject")
            }
        } catch (_: Exception) {
            updateOrderDecision(orderId, "reject")
        }
    }

    suspend fun updateOrderDecision(orderId: String, mode: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.updateOrderDecision(mode, orderId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Order $mode finished.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to update order", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error updating order")
        }
    }

    suspend fun createAdmin(username: String, password: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.createAdmin(CreateAdminRequest(username, password))
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Admin created successfully.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to create admin", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error creating admin")
        }
    }

    suspend fun changePassword(current: String, newPass: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.adminChangePassword(ChangePasswordRequest(current, newPass))
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Admin password updated.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to change password", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error changing password")
        }
    }
}
