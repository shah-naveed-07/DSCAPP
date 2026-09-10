package com.dsc.dscweb

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.dsc.dscweb.actions.ActionExecutor
import com.dsc.dscweb.ai.MjAssistantEngine
import com.dsc.dscweb.ai.MjVoiceManager
import com.dsc.dscweb.auth.AuthManager
import com.dsc.dscweb.data.DeviceIdProvider
import com.dsc.dscweb.data.SessionDataStore
import com.dsc.dscweb.navigation.DscNavHost
import com.dsc.dscweb.navigation.Screen
import com.dsc.dscweb.network.ApiClient
import com.dsc.dscweb.repository.AdminRepository
import com.dsc.dscweb.repository.AuthRepository
import com.dsc.dscweb.repository.OwnerRepository
import com.dsc.dscweb.repository.PublicRepository
import com.dsc.dscweb.repository.UserRepository
import com.dsc.dscweb.screens.MjAssistantBottomSheet
import com.dsc.dscweb.ui.components.DscBottomNavBar
import com.dsc.dscweb.ui.components.DscTopAppBar
import com.dsc.dscweb.ui.components.FloatingMjButton
import com.dsc.dscweb.ui.theme.DSCWebTheme
import com.dsc.dscweb.ui.theme.SurfaceDark
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var voiceManager: MjVoiceManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // 1. Initialize core managers and repositories
        val sessionDataStore = SessionDataStore(applicationContext)
        val deviceIdProvider = DeviceIdProvider(applicationContext)
        val apiService = ApiClient.create(sessionDataStore)

        val authRepository = AuthRepository(apiService, sessionDataStore, deviceIdProvider)
        val userRepository = UserRepository(apiService, sessionDataStore)
        val adminRepository = AdminRepository(apiService)
        val ownerRepository = OwnerRepository(apiService)
        val publicRepository = PublicRepository(apiService, sessionDataStore)

        voiceManager = MjVoiceManager(applicationContext)

        setContent {
            DSCWebTheme {
                MainAppContent(
                    authRepository = authRepository,
                    userRepository = userRepository,
                    adminRepository = adminRepository,
                    ownerRepository = ownerRepository,
                    publicRepository = publicRepository,
                    voiceManager = voiceManager,
                    onExit = { finish() }
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        voiceManager.release()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppContent(
    authRepository: AuthRepository,
    userRepository: UserRepository,
    adminRepository: AdminRepository,
    ownerRepository: OwnerRepository,
    publicRepository: PublicRepository,
    voiceManager: MjVoiceManager,
    onExit: () -> Unit
) {
    val navController = rememberNavController()
    val scope = rememberCoroutineScope()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val session by AuthManager.session.collectAsState()

    var isMjSheetVisible by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val actionExecutor = remember(navController, session) {
        ActionExecutor(
            context = navController.context,
            navController = navController,
            onLogoutRequested = {
                scope.launch {
                    authRepository.logout()
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                }
            },
            onCopyKeyRequested = {
                scope.launch {
                    val order = userRepository.fetchMyOrder().getOrNull()
                    if (order?.key != null) {
                        Toast.makeText(navController.context, "Key copied: ${order.key}", Toast.LENGTH_SHORT).show()
                    }
                }
            },
            onChangePasswordRequested = {
                navController.navigate(Screen.UserDashboard.route)
            }
        )
    }

    val mjEngine = remember(actionExecutor) {
        MjAssistantEngine(actionExecutor)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceDark)
    ) {
        Scaffold(
            topBar = {
                DscTopAppBar(
                    currentTitle = currentRoute ?: "DSC Hub",
                    session = session,
                    onOpenMj = { isMjSheetVisible = true },
                    onNavigateUserPortal = {
                        navController.navigate(Screen.UserDashboard.route)
                    },
                    onNavigateStaffPortal = {
                        if (session?.isOwner == true) {
                            navController.navigate(Screen.OwnerControlCenter.route)
                        } else {
                            navController.navigate(Screen.AdminDashboard.route)
                        }
                    }
                )
            },
            bottomBar = {
                DscBottomNavBar(
                    currentRoute = currentRoute,
                    onNavigate = { screen ->
                        navController.navigate(screen.route) {
                            popUpTo(Screen.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            },
            containerColor = SurfaceDark
        ) { paddingValues ->
            DscNavHost(
                navController = navController,
                paddingValues = paddingValues,
                session = session,
                authRepository = authRepository,
                userRepository = userRepository,
                adminRepository = adminRepository,
                ownerRepository = ownerRepository,
                publicRepository = publicRepository,
                onLogout = {
                    scope.launch {
                        authRepository.logout()
                    }
                }
            )
        }

        // Floating "Ask MJ" Button positioned above bottom navigation bar
        FloatingMjButton(
            onClick = { isMjSheetVisible = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 80.dp)
        )

        // MJ Assistant Bottom Sheet
        if (isMjSheetVisible) {
            MjAssistantBottomSheet(
                sheetState = sheetState,
                currentRoute = currentRoute,
                session = session,
                mjEngine = mjEngine,
                voiceManager = voiceManager,
                onDismiss = { isMjSheetVisible = false },
                onExecuteActionConfirmed = { action ->
                    actionExecutor.execute(action.id, session, confirmed = true)
                }
            )
        }
    }
}
