package com.dsc.dscweb

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.dsc.dscweb.actions.AioraActionExecutor
import com.dsc.dscweb.ai.AioraAssistantEngine
import com.dsc.dscweb.ai.AioraVoiceManager
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
import com.dsc.dscweb.screens.AioraAssistantBottomSheet
import com.dsc.dscweb.ui.components.DscBottomNavBar
import com.dsc.dscweb.ui.components.DscTopAppBar
import com.dsc.dscweb.ui.components.FloatingAioraButton
import com.dsc.dscweb.ui.theme.DSCWebTheme
import com.dsc.dscweb.ui.theme.SurfaceDark
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var voiceManager: AioraVoiceManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // 1. Initialize core managers and repositories
        val sessionDataStore = SessionDataStore(applicationContext)
        val deviceIdProvider = DeviceIdProvider(applicationContext)
        val authManager = AuthManager(sessionDataStore)
        val apiService = ApiClient.createService { authManager.getToken() }

        val authRepository = AuthRepository(apiService, authManager, deviceIdProvider)
        val userRepository = UserRepository(apiService)
        val adminRepository = AdminRepository(apiService)
        val ownerRepository = OwnerRepository(apiService, sessionDataStore)
        val publicRepository = PublicRepository(apiService)

        voiceManager = AioraVoiceManager(applicationContext)

        setContent {
            DSCWebTheme {
                MainAppContent(
                    authManager = authManager,
                    authRepository = authRepository,
                    userRepository = userRepository,
                    adminRepository = adminRepository,
                    ownerRepository = ownerRepository,
                    publicRepository = publicRepository,
                    voiceManager = voiceManager
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
    authManager: AuthManager,
    authRepository: AuthRepository,
    userRepository: UserRepository,
    adminRepository: AdminRepository,
    ownerRepository: OwnerRepository,
    publicRepository: PublicRepository,
    voiceManager: AioraVoiceManager
) {
    val context = LocalContext.current
    val navController = rememberNavController()
    val scope = rememberCoroutineScope()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val session by authManager.currentSession.collectAsState()

    var isAioraSheetVisible by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    // Runtime Permission Launcher for POST_NOTIFICATIONS (Android 13+ / API 33+)
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Toast.makeText(context, "Notifications enabled for DSC operations.", Toast.LENGTH_SHORT).show()
        }
    }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val hasNotificationPermission = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED

            if (!hasNotificationPermission) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    val actionExecutor = remember(navController, session) {
        AioraActionExecutor(
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

    val aioraEngine = remember(actionExecutor) {
        AioraAssistantEngine(actionExecutor)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceDark)
    ) {
        Scaffold(
            topBar = {
                DscTopAppBar(
                    currentTitle = Screen.fromRoute(currentRoute).title,
                    session = session,
                    onOpenAiora = { isAioraSheetVisible = true },
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

        // Floating "Ask Aiora" Button positioned above bottom navigation bar
        FloatingAioraButton(
            onClick = { isAioraSheetVisible = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 80.dp)
        )

        // Aiora Assistant Bottom Sheet
        if (isAioraSheetVisible) {
            AioraAssistantBottomSheet(
                sheetState = sheetState,
                currentRoute = currentRoute,
                session = session,
                aioraEngine = aioraEngine,
                voiceManager = voiceManager,
                onDismiss = { isAioraSheetVisible = false },
                onExecuteActionConfirmed = { action ->
                    actionExecutor.execute(action.id, session, confirmed = true)
                }
            )
        }
    }
}
