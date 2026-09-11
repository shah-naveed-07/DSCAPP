package com.dsc.dscweb.repository

import com.dsc.dscweb.model.ChangePasswordRequest
import com.dsc.dscweb.model.CheckoutRequest
import com.dsc.dscweb.model.UserOrder
import com.dsc.dscweb.network.DscAuthService
import com.dsc.dscweb.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class UserRepository(private val service: DscAuthService) {

    suspend fun fetchMyOrder(): NetworkResult<UserOrder> = withContext(Dispatchers.IO) {
        try {
            val res = service.getUserOrder()
            if (res.isSuccessful && res.body() != null) {
                NetworkResult.Success(res.body()!!)
            } else {
                NetworkResult.Error(
                    res.errorBody()?.string()?.ifBlank { null }
                        ?: "Failed to retrieve subscription order (${res.code()})",
                    res.code()
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error fetching subscription order")
        }
    }

    suspend fun fetchDownloadUrl(plan: String): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val res = service.getDownloadUrl(plan)
            if (res.isSuccessful && !res.body()?.url.isNullOrBlank()) {
                NetworkResult.Success(res.body()!!.url!!)
            } else {
                NetworkResult.Error(
                    res.errorBody()?.string()?.ifBlank { null }
                        ?: "Download link unavailable (${res.code()})",
                    res.code()
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error retrieving download link")
        }
    }

    suspend fun checkout(
        username: String,
        password: String,
        plan: String,
        days: Int = 30,
        amount: String = ""
    ): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val req = CheckoutRequest(
                username = username.trim(),
                passwordHash = password,
                plan = plan,
                days = days,
                amount = amount
            )
            val res = service.checkout(req)
            if (res.isSuccessful) {
                NetworkResult.Success(res.body()?.message ?: "Order submitted successfully! Awaiting verification.")
            } else {
                NetworkResult.Error(
                    res.errorBody()?.string()?.ifBlank { null }
                        ?: "Failed to submit order (${res.code()})",
                    res.code()
                )
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error submitting order")
        }
    }

    suspend fun changePassword(current: String, newPass: String): NetworkResult<String> =
        withContext(Dispatchers.IO) {
            try {
                val res = service.userChangePassword(ChangePasswordRequest(current, newPass))
                if (res.isSuccessful) {
                    NetworkResult.Success(res.body()?.message ?: "Password changed successfully!")
                } else {
                    NetworkResult.Error(res.errorBody()?.string() ?: "Failed to change password.", res.code())
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Network error changing password")
            }
        }
}
