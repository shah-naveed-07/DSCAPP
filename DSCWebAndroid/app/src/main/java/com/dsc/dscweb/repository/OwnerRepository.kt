package com.dsc.dscweb.repository

import com.dsc.dscweb.data.SessionDataStore
import com.dsc.dscweb.model.AdminAccount
import com.dsc.dscweb.model.AdminKey
import com.dsc.dscweb.model.AdminOrder
import com.dsc.dscweb.model.AdminUser
import com.dsc.dscweb.model.CreateAdminRequest
import com.dsc.dscweb.model.CreateKeyRequest
import com.dsc.dscweb.model.FreeUserRecord
import com.dsc.dscweb.model.PanelUpdateRecord
import com.dsc.dscweb.model.PanelUpdateRequest
import com.dsc.dscweb.model.SystemSettings
import com.dsc.dscweb.network.DscAuthService
import com.dsc.dscweb.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class OwnerRepository(
    private val service: DscAuthService,
    private val dataStore: SessionDataStore
) {
    suspend fun verifyOwnerProbe(): Boolean = withContext(Dispatchers.IO) {
        try {
            val res = service.ownerProbe()
            res.isSuccessful
        } catch (_: Exception) {
            false
        }
    }

    suspend fun getKeys(): NetworkResult<List<AdminKey>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getKeys()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to fetch keys (${res.code()})", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error fetching keys")
        }
    }

    suspend fun fetchKeys(): NetworkResult<List<AdminKey>> = getKeys()

    suspend fun createKey(plan: String, durationDays: Int): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.createKey(CreateKeyRequest(plan, durationDays))
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Key generated successfully.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to generate key", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error generating key")
        }
    }

    suspend fun generateKey(plan: String, durationDays: Int): NetworkResult<String> = createKey(plan, durationDays)

    suspend fun updateKey(key: AdminKey): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.updateKey(key)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Key updated.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to update key", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error updating key")
        }
    }

    suspend fun deleteKey(keyId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.deleteKey(keyId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Key removed.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to delete key", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error deleting key")
        }
    }

    suspend fun getAdmins(): NetworkResult<List<AdminAccount>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getAdmins()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to fetch admins (${res.code()})", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error fetching admins")
        }
    }

    suspend fun fetchAdmins(): NetworkResult<List<AdminAccount>> = getAdmins()

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

    suspend fun updateAdmin(admin: AdminAccount): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.updateAdmin(admin)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Admin account updated.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to update admin account", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error updating admin account")
        }
    }

    suspend fun deleteAdmin(adminId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.deleteAdmin(adminId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Admin removed.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to delete admin", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error deleting admin")
        }
    }

    suspend fun getSettings(): NetworkResult<SystemSettings> = withContext(Dispatchers.IO) {
        try {
            val res = service.getSettings()
            if (res.isSuccessful && !res.body().isNullOrEmpty()) {
                val s = res.body()!!.first()
                dataStore.saveSystemSettings(s)
                NetworkResult.Success(s)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to fetch settings (${res.code()})", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error fetching settings")
        }
    }

    suspend fun updateSettings(settings: SystemSettings): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            dataStore.saveSystemSettings(settings)
            val res = service.updateSettings(settings)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Settings saved successfully.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to save settings", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error saving settings")
        }
    }

    suspend fun toggleMaintenance(enabled: Boolean? = null): NetworkResult<Boolean> = withContext(Dispatchers.IO) {
        try {
            val targetState = enabled ?: run {
                val current = getSettings().getOrNull()
                !(current?.isMaintenanceMode == true || current?.maintenance == true)
            }
            val payload = mapOf("isMaintenanceMode" to targetState, "IsMaintenanceMode" to targetState)
            val res = service.toggleMaintenance(payload)
            if (res.isSuccessful) {
                val isMaint = res.body()?.isMaintenanceMode == true || res.body()?.maintenance == true
                NetworkResult.Success(isMaint)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to toggle maintenance", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error toggling maintenance")
        }
    }

    suspend fun updateUserPass(user: String, pass: String, slots: Int): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val settingsResult = getSettings()
            val currentSettings = settingsResult.getOrNull() ?: SystemSettings()

            val updatedSettings = currentSettings.copy(
                freeUsername = user.trim(),
                freePassword = pass,
                maxFreeSlots = slots,
                freeValidDays = 30
            )

            val updateRes = updateSettings(updatedSettings)
            if (updateRes is NetworkResult.Success) {
                getSettings()
                NetworkResult.Success(updateRes.data)
            } else {
                updateRes
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error updating Global UserPass")
        }
    }

    suspend fun getFreeUsers(): NetworkResult<List<FreeUserRecord>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getFreeUsers()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to fetch free users (${res.code()})", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error fetching free users")
        }
    }

    suspend fun updateFreeUser(user: FreeUserRecord): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.updateFreeUser(user)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Free user updated.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to update free user", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error updating free user")
        }
    }

    suspend fun deleteFreeUser(freeUserId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val idInt = freeUserId.toIntOrNull() ?: 0
            val res = service.deleteFreeUser(idInt.toString())
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Free user slot released.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to remove free user", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error removing free user")
        }
    }

    suspend fun getAllOrders(): NetworkResult<List<AdminOrder>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getAllOrders()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to fetch all orders (${res.code()})", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error fetching orders")
        }
    }

    suspend fun updateOrder(order: AdminOrder): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.updateOrder(order)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Order updated.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to update order", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error updating order")
        }
    }

    suspend fun deleteOrder(orderId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.deleteOrder(orderId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Order deleted.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to delete order", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error deleting order")
        }
    }

    suspend fun getUsers(): NetworkResult<List<AdminUser>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getAdminUsers()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to fetch users (${res.code()})", res.code())
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

    suspend fun deleteUser(userId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.deleteAdminUser(userId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "User deleted.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to delete user", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error deleting user")
        }
    }

    suspend fun getPanelUpdates(): NetworkResult<PanelUpdateRecord> = withContext(Dispatchers.IO) {
        try {
            val res = service.getPanelUpdates()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to fetch panel updates", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error fetching panel updates")
        }
    }

    suspend fun savePanelUpdates(update1: String, update2: String, update3: String, update4: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val req = PanelUpdateRequest(update1, update2, update3, update4)
            val res = service.savePanelUpdates(req)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Panel updates saved successfully.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to save panel updates", res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error saving panel updates")
        }
    }
}
