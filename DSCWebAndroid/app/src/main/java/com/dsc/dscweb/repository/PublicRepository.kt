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
                val errMessage = res.errorBody()?.string()?.ifBlank { null }
                    ?: "Free Panel temporarily unavailable (${res.code()})"
                NetworkResult.Error(errMessage, res.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Free Panel temporarily unavailable. Network connection error.")
        }
    }
}
