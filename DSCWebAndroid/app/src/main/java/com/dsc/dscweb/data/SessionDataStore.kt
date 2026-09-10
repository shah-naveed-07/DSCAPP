package com.dsc.dscweb.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.dsc.dscweb.auth.UserRole
import com.dsc.dscweb.auth.UserSession
import com.dsc.dscweb.model.SystemSettings
import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "dsc_session_prefs")

class SessionDataStore(private val context: Context) {
    private val gson = Gson()

    val sessionFlow: Flow<UserSession?> = context.dataStore.data.map { prefs ->
        val token = prefs[KEY_TOKEN] ?: return@map null
        val username = prefs[KEY_USERNAME] ?: ""
        val roleStr = prefs[KEY_ROLE] ?: UserRole.User.name
        val isOwner = prefs[KEY_IS_OWNER] ?: false
        val exp = prefs[KEY_EXP]

        val role = try {
            UserRole.valueOf(roleStr)
        } catch (_: Exception) {
            UserRole.User
        }

        UserSession(
            token = token,
            username = username,
            role = role,
            isOwner = isOwner,
            expiresAt = exp
        )
    }

    val systemSettingsFlow: Flow<SystemSettings> = context.dataStore.data.map { prefs ->
        val json = prefs[KEY_SYSTEM_SETTINGS]
        if (!json.isNullOrBlank()) {
            try {
                gson.fromJson(json, SystemSettings::class.java)
            } catch (_: Exception) {
                SystemSettings()
            }
        } else {
            SystemSettings()
        }
    }

    suspend fun saveSession(session: UserSession) {
        context.dataStore.edit { prefs ->
            prefs[KEY_TOKEN] = session.token
            prefs[KEY_USERNAME] = session.username
            prefs[KEY_ROLE] = session.role.name
            prefs[KEY_IS_OWNER] = session.isOwner
            if (session.expiresAt != null) {
                prefs[KEY_EXP] = session.expiresAt
            } else {
                prefs.remove(KEY_EXP)
            }
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { prefs ->
            prefs.remove(KEY_TOKEN)
            prefs.remove(KEY_USERNAME)
            prefs.remove(KEY_ROLE)
            prefs.remove(KEY_IS_OWNER)
            prefs.remove(KEY_EXP)
        }
    }

    suspend fun saveSystemSettings(settings: SystemSettings) {
        context.dataStore.edit { prefs ->
            prefs[KEY_SYSTEM_SETTINGS] = gson.toJson(settings)
        }
    }

    companion object {
        private val KEY_TOKEN = stringPreferencesKey("session_token")
        private val KEY_USERNAME = stringPreferencesKey("session_username")
        private val KEY_ROLE = stringPreferencesKey("session_role")
        private val KEY_IS_OWNER = booleanPreferencesKey("session_is_owner")
        private val KEY_EXP = longPreferencesKey("session_exp")
        private val KEY_SYSTEM_SETTINGS = stringPreferencesKey("cached_system_settings")
    }
}
