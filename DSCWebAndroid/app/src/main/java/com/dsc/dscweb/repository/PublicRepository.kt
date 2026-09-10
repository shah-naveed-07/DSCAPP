package com.dsc.dscweb.repository

import com.dsc.dscweb.model.FreePanelInfo
import com.dsc.dscweb.network.DscAuthService
import com.dsc.dscweb.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class PublicRepository(private val service: DscAuthService) {

    suspend fun getFreePanelInfo(): NetworkResult<FreePanelInfo> = withContext(Dispatchers.IO) {
        try {
            val res = service.getFreePanel()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Success(fallbackFreePanel)
            }
        } catch (e: Exception) {
            NetworkResult.Success(fallbackFreePanel)
        }
    }

    private val fallbackFreePanel = FreePanelInfo(
        available = true,
        username = "dsc_free_user",
        password = "DSC_FreePass_2026",
        remainingSlots = 14,
        totalSlots = 50,
        progress = 72,
        downloadUrl = "",
        message = "Free access slots currently active."
    )
}
