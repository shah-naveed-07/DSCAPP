package com.dsc.dscweb.navigation

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.dsc.dscweb.auth.UserRole
import com.dsc.dscweb.auth.UserSession
import com.dsc.dscweb.repository.AdminRepository
import com.dsc.dscweb.repository.AuthRepository
import com.dsc.dscweb.repository.OwnerRepository
import com.dsc.dscweb.repository.PublicRepository
import com.dsc.dscweb.repository.UserRepository
import com.dsc.dscweb.screens.AdminDashboardScreen
import com.dsc.dscweb.screens.AdminLoginScreen
import com.dsc.dscweb.screens.AppsScreen
import com.dsc.dscweb.screens.DownloadsScreen
import com.dsc.dscweb.screens.FreePanelScreen
import com.dsc.dscweb.screens.HomeScreen
import com.dsc.dscweb.screens.OwnerControlCenterScreen
import com.dsc.dscweb.screens.ProductsScreen
import com.dsc.dscweb.screens.UserDashboardScreen
import com.dsc.dscweb.screens.UserLoginScreen
import com.dsc.dscweb.screens.UserRegisterScreen

@Composable
fun DscNavHost(
    navController: NavHostController,
    paddingValues: PaddingValues,
    session: UserSession?,
    authRepository: AuthRepository,
    userRepository: UserRepository,
    adminRepository: AdminRepository,
    ownerRepository: OwnerRepository,
    publicRepository: PublicRepository,
    onLogout: () -> Unit
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = Modifier.padding(paddingValues)
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigate = { screen -> navController.navigate(screen.route) }
            )
        }

        composable(Screen.Apps.route) {
            AppsScreen()
        }

        composable(Screen.Products.route) {
            ProductsScreen()
        }

        composable(Screen.FreePanel.route) {
            FreePanelScreen(publicRepository = publicRepository)
        }

        composable(Screen.Downloads.route) {
            DownloadsScreen()
        }

        composable(Screen.UserLogin.route) {
            UserLoginScreen(
                authRepository = authRepository,
                onLoginSuccess = {
                    navController.navigate(Screen.UserDashboard.route) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onNavigateRegister = {
                    navController.navigate(Screen.UserRegister.route)
                },
                onNavigateStaffLogin = {
                    navController.navigate(Screen.AdminLogin.route)
                }
            )
        }

        composable(Screen.UserRegister.route) {
            UserRegisterScreen(
                authRepository = authRepository,
                onRegisterSuccess = {
                    navController.navigate(Screen.UserLogin.route) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onNavigateLogin = {
                    navController.navigate(Screen.UserLogin.route)
                }
            )
        }

        composable(Screen.UserDashboard.route) {
            if (session != null && session.role == UserRole.User) {
                UserDashboardScreen(
                    session = session,
                    userRepository = userRepository,
                    onLogout = {
                        onLogout()
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Home.route) { inclusive = true }
                        }
                    }
                )
            } else {
                UserLoginScreen(
                    authRepository = authRepository,
                    onLoginSuccess = {
                        navController.navigate(Screen.UserDashboard.route)
                    },
                    onNavigateRegister = {
                        navController.navigate(Screen.UserRegister.route)
                    },
                    onNavigateStaffLogin = {
                        navController.navigate(Screen.AdminLogin.route)
                    }
                )
            }
        }

        composable(Screen.AdminLogin.route) {
            AdminLoginScreen(
                authRepository = authRepository,
                onLoginSuccess = {
                    navController.navigate(Screen.AdminDashboard.route) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onNavigateUserLogin = {
                    navController.navigate(Screen.UserLogin.route)
                }
            )
        }

        composable(Screen.AdminDashboard.route) {
            if (session != null && (session.role == UserRole.Admin || session.isOwner)) {
                AdminDashboardScreen(
                    session = session,
                    adminRepository = adminRepository,
                    onNavigateOwner = {
                        navController.navigate(Screen.OwnerControlCenter.route)
                    },
                    onLogout = {
                        onLogout()
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Home.route) { inclusive = true }
                        }
                    }
                )
            } else {
                AdminLoginScreen(
                    authRepository = authRepository,
                    onLoginSuccess = {
                        navController.navigate(Screen.AdminDashboard.route)
                    },
                    onNavigateUserLogin = {
                        navController.navigate(Screen.UserLogin.route)
                    }
                )
            }
        }

        composable(Screen.OwnerControlCenter.route) {
            if (session != null) {
                OwnerControlCenterScreen(
                    session = session,
                    ownerRepository = ownerRepository,
                    onBack = {
                        navController.popBackStack()
                    }
                )
            } else {
                AdminLoginScreen(
                    authRepository = authRepository,
                    onLoginSuccess = { s ->
                        if (s.isOwner) {
                            navController.navigate(Screen.OwnerControlCenter.route)
                        } else {
                            navController.navigate(Screen.AdminDashboard.route)
                        }
                    },
                    onNavigateUserLogin = {
                        navController.navigate(Screen.UserLogin.route)
                    }
                )
            }
        }
    }
}
