package com.dsc.dscweb.network

import com.dsc.dscweb.model.AdminAccount
import com.dsc.dscweb.model.AdminKey
import com.dsc.dscweb.model.AdminOrder
import com.dsc.dscweb.model.AdminUser
import com.dsc.dscweb.model.AuthResponse
import com.dsc.dscweb.model.ChangePasswordRequest
import com.dsc.dscweb.model.CheckoutRequest
import com.dsc.dscweb.model.CreateAdminRequest
import com.dsc.dscweb.model.CreateKeyRequest
import com.dsc.dscweb.model.DownloadUrlResponse
import com.dsc.dscweb.model.FreePanelInfo
import com.dsc.dscweb.model.FreeUserRecord
import com.dsc.dscweb.model.GenericMessageResponse
import com.dsc.dscweb.model.LoginRequest
import com.dsc.dscweb.model.PanelUpdateRecord
import com.dsc.dscweb.model.PanelUpdateRequest
import com.dsc.dscweb.model.RegisterRequest
import com.dsc.dscweb.model.SystemSettings
import com.dsc.dscweb.model.SystemStatus
import com.dsc.dscweb.model.UserOrder
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface DscAuthService {

    // ---------------------------------------------------------------------
    // Public APIs
    // ---------------------------------------------------------------------
    @GET("api/public/free-panel")
    suspend fun getFreePanel(): Response<FreePanelInfo>

    @GET("api/auth/panel-updates")
    suspend fun getPanelUpdates(): Response<PanelUpdateRecord>

    // ---------------------------------------------------------------------
    // Auth APIs
    // ---------------------------------------------------------------------
    @POST("api/auth/register")
    suspend fun register(@Body req: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun loginUser(@Body req: LoginRequest): Response<AuthResponse>

    @POST("api/admin/login")
    suspend fun loginAdmin(@Body req: LoginRequest): Response<AuthResponse>

    @GET("api/auth/protected")
    suspend fun getProtectedSession(): Response<GenericMessageResponse>

    // ---------------------------------------------------------------------
    // User APIs
    // ---------------------------------------------------------------------
    @GET("api/auth/my-order")
    suspend fun getUserOrder(): Response<UserOrder>

    @GET("api/auth/download")
    suspend fun getDownloadUrl(@Query("plan") plan: String): Response<DownloadUrlResponse>

    @POST("api/auth/checkout")
    suspend fun checkout(@Body req: CheckoutRequest): Response<GenericMessageResponse>

    @POST("api/auth/change-password")
    suspend fun userChangePassword(@Body req: ChangePasswordRequest): Response<GenericMessageResponse>

    // ---------------------------------------------------------------------
    // Admin & Owner Shared APIs
    // ---------------------------------------------------------------------
    @GET("api/admin/probe")
    suspend fun adminProbe(): Response<GenericMessageResponse>

    @GET("api/admin/system-status")
    suspend fun getSystemStatus(): Response<SystemStatus>

    @GET("api/admin/users")
    suspend fun getAdminUsers(): Response<List<AdminUser>>

    @PUT("api/admin/user/update")
    suspend fun updateAdminUser(@Body user: AdminUser): Response<GenericMessageResponse>

    @PUT("api/admin/user/ban")
    suspend fun banAdminUser(@Body user: AdminUser): Response<GenericMessageResponse>

    @DELETE("api/admin/user/delete/{id}")
    suspend fun deleteAdminUser(@Path("id") id: String): Response<GenericMessageResponse>

    @GET("api/admin/orders/pending")
    suspend fun getPendingOrders(): Response<List<AdminOrder>>

    @GET("api/admin/orders/all")
    suspend fun getAllOrders(): Response<List<AdminOrder>>

    @POST("api/admin/orders/approve/{id}")
    suspend fun approveOrder(@Path("id") id: String): Response<GenericMessageResponse>

    @POST("api/admin/orders/reject/{id}")
    suspend fun rejectOrder(@Path("id") id: String): Response<GenericMessageResponse>

    @PUT("api/admin/orders/update")
    suspend fun updateOrder(@Body order: AdminOrder): Response<GenericMessageResponse>

    @DELETE("api/admin/orders/delete/{id}")
    suspend fun deleteOrder(@Path("id") id: String): Response<GenericMessageResponse>

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
    // Owner-Only Control Center APIs
    // ---------------------------------------------------------------------
    @GET("api/admin/owner/probe")
    suspend fun ownerProbe(): Response<GenericMessageResponse>

    @GET("api/admin/keys")
    suspend fun getKeys(): Response<List<AdminKey>>

    @POST("api/admin/generate")
    suspend fun generateKey(@Body req: CreateKeyRequest): Response<GenericMessageResponse>

    @POST("api/admin/manage/key")
    suspend fun createKey(@Body req: CreateKeyRequest): Response<GenericMessageResponse>

    @PUT("api/admin/manage/key")
    suspend fun updateKey(@Body key: AdminKey): Response<GenericMessageResponse>

    @DELETE("api/admin/manage/key/delete/{id}")
    suspend fun deleteKey(@Path("id") id: String): Response<GenericMessageResponse>

    @GET("api/admin/manage/admins")
    suspend fun getAdmins(): Response<List<AdminAccount>>

    @PUT("api/admin/manage/admin")
    suspend fun updateAdmin(@Body admin: AdminAccount): Response<GenericMessageResponse>

    @DELETE("api/admin/manage/admin/delete/{id}")
    suspend fun deleteAdmin(@Path("id") id: String): Response<GenericMessageResponse>

    @GET("api/admin/settings/all")
    suspend fun getSettings(): Response<List<SystemSettings>>

    @PUT("api/admin/settings/update")
    suspend fun updateSettings(@Body settings: SystemSettings): Response<GenericMessageResponse>

    @GET("api/admin/maintenance")
    suspend fun getMaintenanceStatus(): Response<GenericMessageResponse>

    @POST("api/admin/maintenance/toggle")
    suspend fun toggleMaintenance(@Body req: Map<String, Boolean>): Response<GenericMessageResponse>

    @GET("api/admin/free-users")
    suspend fun getFreeUsers(): Response<List<FreeUserRecord>>

    @PUT("api/admin/manage/free-user/update")
    suspend fun updateFreeUser(@Body user: FreeUserRecord): Response<GenericMessageResponse>

    @DELETE("api/admin/manage/free-user/delete/{id}")
    suspend fun deleteFreeUser(@Path("id") id: String): Response<GenericMessageResponse>

    @PUT("panel-updates/save")
    suspend fun savePanelUpdates(@Body req: PanelUpdateRequest): Response<GenericMessageResponse>
}
