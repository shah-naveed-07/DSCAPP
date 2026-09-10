package com.dsc.dscweb.auth

import com.dsc.dscweb.data.SessionDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class AuthManager(
    private val dataStore: SessionDataStore,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO)
) {
    private val _currentSession = MutableStateFlow<UserSession?>(null)
    val currentSession: StateFlow<UserSession?> = _currentSession.asStateFlow()

    init {
        scope.launch {
            dataStore.sessionFlow.collectLatest { session ->
                if (session != null && session.isExpired) {
                    logout()
                } else {
                    _currentSession.value = session
                }
            }
        }
    }

    fun getToken(): String? = _currentSession.value?.token

    val isLoggedIn: Boolean
        get() = _currentSession.value?.token != null && !_currentSession.value!!.isExpired

    val currentUserRole: UserRole
        get() = _currentSession.value?.role ?: UserRole.Guest

    val isOwner: Boolean
        get() = _currentSession.value?.isOwner == true

    suspend fun setSession(session: UserSession) {
        _currentSession.value = session
        dataStore.saveSession(session)
    }

    suspend fun logout() {
        _currentSession.value = null
        dataStore.clearSession()
    }
}
