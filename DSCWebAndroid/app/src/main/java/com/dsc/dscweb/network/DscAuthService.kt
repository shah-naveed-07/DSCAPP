package com.dsc.dscweb.network

import com.dsc.dscweb.model.AdminAccount
import com.dsc.dscweb.model.AdminKey
import com.dsc.dscweb.model.AdminOrder
import com.dsc.dscweb.model.AdminUser
import com.dsc.dscweb.model.AuthResponse
import com.dsc.dscweb.model.ChangePasswordRequest
import com.dsc.dscweb.model.CreateAdminRequest
import com.dsc.dscweb.model.CreateKeyRequest
import com.dsc.dscweb.model.FreePanelInfo
import com.dsc.dscweb.model.FreeUserRecord
import com.dsc.dscweb.model.GenericMessageResponse
import com.dsc.dscweb.model.LoginRequest
import com.dsc.dscweb.model.PanelStatusUpdate
import com.dsc.dscweb.model.PanelUpdate
import com.dsc.dscweb.model.RegisterRequest
import com.dsc.dscweb.model.SystemSettings
import com.dsc.dscweb.model.SystemStatus
import com.dsc.dscweb.model.UserOrder
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface DscAuthService {

    // ---------------------------------------------------------------------
    // Public APIs
    // ---------------------------------------------------------------------
    @GET("api/public/free-panel")
    suspend fun getFreePanel(): Response<FreePanelInfo>

    // ---------------------------------------------------------------------
    // Auth APIs
    // ---------------------------------------------------------------------
    @POST("api/auth/register")
    suspend fun register(@Body req: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun loginUser(@Body req: LoginRequest): Response<AuthResponse>

    @POST("api/admin/login")
    suspend fun loginAdmin(@Body req: LoginRequest): Response<AuthResponse>

    // ---------------------------------------------------------------------
    // User APIs
    // ---------------------------------------------------------------------
    @GET("api/auth/my-order")
    suspend fun getUserOrder(): Response<UserOrder>

    @POST("api/auth/change-password")
    suspend fun userChangePassword(@Body req: ChangePasswordRequest): Response<GenericMessageResponse>

    // ---------------------------------------------------------------------
    // Admin APIs
    // ---------------------------------------------------------------------
    @GET("api/admin/probe")
    suspend fun adminProbe(): Response<GenericMessageResponse>

    @GET("api/admin/system-status")
    suspend fun getSystemStatus(): Response<SystemStatus>

    @GET("api/admin/users")
    suspend fun getAdminUsers(): Response<List<AdminUser>>

    @POST("api/admin/user/update")
    suspend fun updateAdminUser(@Body user: AdminUser): Response<GenericMessageResponse>

    @DELETE("api/admin/user/delete/{id}")
    suspend fun deleteAdminUser(@Path("id") id: String): Response<GenericMessageResponse>

    @GET("api/admin/orders/pending")
    suspend fun getPendingOrders(): Response<List<AdminOrder>>

    @POST("api/admin/orders/{mode}/{orderId}")
    suspend fun updateOrderDecision(
        @Path("mode") mode: String,
        @Path("orderId") orderId: String
    ): Response<GenericMessageResponse>

    @POST("api/admin/create-admin")
    suspend fun createAdmin(@Body req: CreateAdminRequest): Response<GenericMessageResponse>

    @POST("api/admin/change-password")
    suspend fun adminChangePassword(@Body req: ChangePasswordRequest): Response<GenericMessageResponse>

    // ---------------------------------------------------------------------
    // Owner APIs
    // ---------------------------------------------------------------------
    @GET("api/admin/owner/probe")
    suspend fun ownerProbe(): Response<GenericMessageResponse>

    @GET("api/admin/keys")
    suspend fun getKeys(): Response<List<AdminKey>>

    @POST("api/admin/manage/key")
    suspend fun createKey(@Body req: CreateKeyRequest): Response<GenericMessageResponse>

    @DELETE("api/admin/manage/key/delete/{id}")
    suspend fun deleteKey(@Path("id") id: String): Response<GenericMessageResponse>

    @GET("api/admin/manage/admins")
    suspend fun getAdmins(): Response<List<AdminAccount>>

    @DELETE("api/admin/manage/admin/delete/{id}")
    suspend fun deleteAdmin(@Path("id") id: String): Response<GenericMessageResponse>

    @GET("api/admin/settings/all")
    suspend fun getSettings(): Response<SystemSettings>

    @POST("api/admin/settings/update")
    suspend fun updateSettings(@Body settings: SystemSettings): Response<GenericMessageResponse>

    @POST("api/admin/maintenance/toggle")
    suspend fun toggleMaintenance(): Response<GenericMessageResponse>

    @GET("api/admin/panel-updates")
    suspend fun getPanelUpdates(): Response<List<PanelUpdate>>

    @GET("api/admin/free-users")
    suspend fun getFreeUsers(): Response<List<FreeUserRecord>>

    @DELETE("api/admin/manage/free-user/delete/{id}")
    suspend fun deleteFreeUser(@Path("id") id: String): Response<GenericMessageResponse>

    @GET("api/auth/panel-updates")
    suspend fun getPanelStatus(): Response<PanelStatusUpdate>

    @POST("api/auth/panel-updates/save")
    suspend fun savePanelStatus(@Body status: PanelStatusUpdate): Response<GenericMessageResponse>

    @GET("api/admin/orders/all")
    suspend fun getAllOrders(): Response<List<AdminOrder>>
}
