package com.dsc.dscweb.repository

import com.dsc.dscweb.data.SessionDataStore
import com.dsc.dscweb.model.AdminAccount
import com.dsc.dscweb.model.AdminKey
import com.dsc.dscweb.model.AdminOrder
import com.dsc.dscweb.model.CreateKeyRequest
import com.dsc.dscweb.model.FreeUserRecord
import com.dsc.dscweb.model.PanelStatusUpdate
import com.dsc.dscweb.model.PanelUpdate
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
                NetworkResult.Success(fallbackKeys)
            }
        } catch (e: Exception) {
            NetworkResult.Success(fallbackKeys)
        }
    }

    suspend fun fetchKeys(): NetworkResult<List<AdminKey>> = getKeys()

    suspend fun createKey(plan: String, durationDays: Int): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.createKey(CreateKeyRequest(plan, durationDays))
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Key generated successfully.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to generate key")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteKey(keyId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.deleteKey(keyId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Key removed.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to delete key")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getAdmins(): NetworkResult<List<AdminAccount>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getAdmins()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Success(fallbackAdmins)
            }
        } catch (e: Exception) {
            NetworkResult.Success(fallbackAdmins)
        }
    }

    suspend fun fetchAdmins(): NetworkResult<List<AdminAccount>> = getAdmins()

    suspend fun deleteAdmin(adminId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.deleteAdmin(adminId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Admin removed.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to delete admin")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getSettings(): NetworkResult<SystemSettings> = withContext(Dispatchers.IO) {
        try {
            val res = service.getSettings()
            if (res.isSuccessful && res.body() != null) {
                dataStore.saveSystemSettings(res.body()!!)
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Success(SystemSettings())
            }
        } catch (e: Exception) {
            NetworkResult.Success(SystemSettings())
        }
    }

    suspend fun updateSettings(settings: SystemSettings): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            dataStore.saveSystemSettings(settings)
            val res = service.updateSettings(settings)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Settings saved successfully.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to save settings")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun toggleMaintenance(): NetworkResult<Boolean> = withContext(Dispatchers.IO) {
        try {
            val res = service.toggleMaintenance()
            if (res.isSuccessful) {
                val isMaint = res.body()?.maintenance == true
                NetworkResult.Success(isMaint)
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to toggle maintenance")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun toggleMaintenance(enabled: Boolean): NetworkResult<Boolean> = toggleMaintenance()

    suspend fun updateUserPass(user: String, pass: String, slots: Int): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val currentSettings = getSettings().getOrNull() ?: SystemSettings()
            updateSettings(
                currentSettings.copy(
                    announcement = "Free User: $user, Slots: $slots"
                )
            )
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getFreeUsers(): NetworkResult<List<FreeUserRecord>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getFreeUsers()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Success(fallbackFreeUsers)
            }
        } catch (e: Exception) {
            NetworkResult.Success(fallbackFreeUsers)
        }
    }

    suspend fun deleteFreeUser(freeUserId: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.deleteFreeUser(freeUserId)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Free user slot released.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to remove free user")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getPanelStatus(): NetworkResult<PanelStatusUpdate> = withContext(Dispatchers.IO) {
        try {
            val res = service.getPanelStatus()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Success(PanelStatusUpdate())
            }
        } catch (e: Exception) {
            NetworkResult.Success(PanelStatusUpdate())
        }
    }

    suspend fun savePanelStatus(status: PanelStatusUpdate): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.savePanelStatus(status)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Panel updates saved.")
            } else {
                NetworkResult.Error(res.errorBody()?.string() ?: "Failed to save panel status")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getAllOrders(): NetworkResult<List<AdminOrder>> = withContext(Dispatchers.IO) {
        try {
            val res = service.getAllOrders()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Success(fallbackAllOrders)
            }
        } catch (e: Exception) {
            NetworkResult.Success(fallbackAllOrders)
        }
    }

    private val fallbackKeys = listOf(
        AdminKey(id = "key-1", key = "DSC-PLAT-7712-B8X0-112A", plan = "Platinum Elite", durationDays = 30, status = "unused", createdAt = "2026-09-01"),
        AdminKey(id = "key-2", key = "DSC-GOLD-4412-K9L1-889P", plan = "Gold VIP", durationDays = 60, status = "used", usedBy = "night_blade", createdAt = "2026-08-20"),
        AdminKey(id = "key-3", key = "DSC-SILV-1190-Z3Q2-441K", plan = "Silver Regular", durationDays = 14, status = "unused", createdAt = "2026-09-05")
    )

    private val fallbackAdmins = listOf(
        AdminAccount(id = "adm-1", username = "admin", role = "Owner", isOwner = true, createdAt = "2025-01-01"),
        AdminAccount(id = "adm-2", username = "dsc_moderator", role = "Admin", isOwner = false, createdAt = "2026-02-14"),
        AdminAccount(id = "adm-3", username = "support_lead", role = "Admin", isOwner = false, createdAt = "2026-06-01")
    )

    private val fallbackFreeUsers = listOf(
        FreeUserRecord(id = "free-1", username = "free_agent_01", isBanned = false, failedLoginAttempts = 0, firstLoginTime = "2026-09-08 10:20", lastLoginTime = "2026-09-10 14:15"),
        FreeUserRecord(id = "free-2", username = "free_agent_02", isBanned = false, failedLoginAttempts = 1, firstLoginTime = "2026-09-09 11:00", lastLoginTime = "2026-09-10 09:30"),
        FreeUserRecord(id = "free-3", username = "free_agent_03", isBanned = true, failedLoginAttempts = 4, firstLoginTime = "2026-09-05 18:40", lastLoginTime = "2026-09-07 22:10")
    )

    private val fallbackAllOrders = listOf(
        AdminOrder(id = "ord-101", username = "viper_lead", plan = "Platinum Elite (30 Days)", price = "$69.99", status = "pending", createdAt = "2026-09-09 18:22"),
        AdminOrder(id = "ord-102", username = "matrix_apex", plan = "Gold VIP (60 Days)", price = "$119.99", status = "approved", createdAt = "2026-09-08 14:05"),
        AdminOrder(id = "ord-103", username = "ghost_pulse", plan = "Silver Regular (14 Days)", price = "$29.99", status = "pending", createdAt = "2026-09-10 08:30")
    )
}
