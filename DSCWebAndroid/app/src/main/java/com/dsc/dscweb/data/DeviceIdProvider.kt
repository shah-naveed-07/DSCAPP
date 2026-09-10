package com.dsc.dscweb.data

import android.content.Context
import android.content.SharedPreferences
import java.util.UUID

/**
 * Internal hardware identifier manager.
 * Note: HWID is handled internally for server device validation and MUST NOT
 * be shown to normal users in Registration, Login, User Dashboard, Profile, or Settings.
 */
class DeviceIdProvider(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("dsc_internal_device_prefs", Context.MODE_PRIVATE)

    fun getInternalHwid(): String {
        var id = prefs.getString(KEY_HWID, null)
        if (id.isNullOrBlank()) {
            val randomSuffix = UUID.randomUUID().toString().substring(0, 8).uppercase()
            id = "DSC-AND-$randomSuffix-${System.currentTimeMillis().toString(36).uppercase()}"
            prefs.edit().putString(KEY_HWID, id).apply()
        }
        return id
    }

    companion object {
        private const val KEY_HWID = "internal_device_hwid"
    }
}
