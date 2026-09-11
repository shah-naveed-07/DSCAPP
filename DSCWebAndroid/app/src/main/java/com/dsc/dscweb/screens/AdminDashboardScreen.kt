package com.dsc.dscweb.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.automirrored.filled.Logout
import com.dsc.dscweb.auth.UserSession
import com.dsc.dscweb.model.AdminOrder
import com.dsc.dscweb.model.AdminUser
import com.dsc.dscweb.network.NetworkResult
import com.dsc.dscweb.repository.AdminRepository
import com.dsc.dscweb.ui.components.DscConfirmationDialog
import com.dsc.dscweb.ui.theme.AccentAmber
import com.dsc.dscweb.ui.theme.AccentEmerald
import com.dsc.dscweb.ui.theme.AccentRose
import com.dsc.dscweb.ui.theme.BorderDark
import com.dsc.dscweb.ui.theme.PrimaryCyan
import com.dsc.dscweb.ui.theme.SecondaryPurple
import com.dsc.dscweb.ui.theme.SurfaceCard
import com.dsc.dscweb.ui.theme.SurfaceDark
import com.dsc.dscweb.ui.theme.TextMuted
import com.dsc.dscweb.ui.theme.TextPrimary
import com.dsc.dscweb.ui.theme.TextSecondary
import kotlinx.coroutines.launch

@Composable
fun AdminDashboardScreen(
    session: UserSession,
    adminRepository: AdminRepository,
    onNavigateOwner: () -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var userList by remember { mutableStateOf<List<AdminUser>>(emptyList()) }
    var orderList by remember { mutableStateOf<List<AdminOrder>>(emptyList()) }
    var searchQuery by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }

    // Dialog state
    var pendingDestructiveAction by remember { mutableStateOf<(() -> Unit)?>(null) }
    var destructiveActionPrompt by remember { mutableStateOf<String?>(null) }

    fun refreshData() {
        scope.launch {
            isLoading = true
            val usersRes = adminRepository.fetchUsers()
            val ordersRes = adminRepository.fetchOrders()
            userList = usersRes.getOrNull() ?: emptyList()
            orderList = ordersRes.getOrNull() ?: emptyList()
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshData()
    }

    val filteredUsers = remember(userList, searchQuery) {
        if (searchQuery.isBlank()) userList
        else userList.filter { it.username.contains(searchQuery, ignoreCase = true) }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceDark),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Staff Header
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceCard)
                    .border(1.dp, SecondaryPurple.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(SecondaryPurple.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AdminPanelSettings,
                            contentDescription = null,
                            tint = SecondaryPurple,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = session.username,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = if (session.isOwner) "Master Owner Session" else "Staff Administrator",
                            fontSize = 12.sp,
                            color = if (session.isOwner) SecondaryPurple else PrimaryCyan
                        )
                    }

                    OutlinedButton(
                        onClick = { refreshData() },
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = SecondaryPurple,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }

        // Owner Clearance Shortcut if session isOwner == true
        if (session.isOwner) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(SecondaryPurple.copy(alpha = 0.15f))
                        .border(1.dp, SecondaryPurple.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                        .clickable { onNavigateOwner() }
                        .padding(16.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = SecondaryPurple,
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Owner Control Center Access",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Backend verified Owner clearance detected. Tap to open master controls.",
                                fontSize = 11.sp,
                                color = TextMuted
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = SecondaryPurple,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }

        // Telemetry Metrics Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricCard(
                    title = "Subscribers",
                    value = userList.size.toString(),
                    color = PrimaryCyan,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Pending Orders",
                    value = orderList.count { it.status.equals("pending", true) }.toString(),
                    color = AccentAmber,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "System",
                    value = "Healthy",
                    color = AccentEmerald,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Search Bar
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search subscribers by username...", color = TextMuted, fontSize = 13.sp) },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted)
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary,
                    focusedBorderColor = SecondaryPurple,
                    unfocusedBorderColor = BorderDark
                ),
                singleLine = true
            )
        }

        // Users Section Header
        item {
            Text(
                text = "SUBSCRIBER MANAGEMENT (${filteredUsers.size})",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextMuted,
                letterSpacing = 1.sp
            )
        }

        // Users List
        items(filteredUsers) { user ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(SurfaceCard)
                    .border(1.dp, BorderDark, RoundedCornerShape(12.dp))
                    .padding(14.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = user.username,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Plan: ${user.plan} • Expiry: ${user.expiry.take(10)}",
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                    }

                    // Ban / Unban Toggle Button
                    val isBanned = user.isBanned
                    OutlinedButton(
                        onClick = {
                            val prompt = if (isBanned) "Unban account '${user.username}'?" else "Ban account '${user.username}' and revoke active session?"
                            destructiveActionPrompt = prompt
                            pendingDestructiveAction = {
                                scope.launch {
                                    adminRepository.setUserBanned(user.username, !isBanned)
                                    Toast.makeText(context, "User status updated", Toast.LENGTH_SHORT).show()
                                    refreshData()
                                }
                            }
                        },
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = if (isBanned) "Unban" else "Ban",
                            fontSize = 11.sp,
                            color = if (isBanned) AccentEmerald else AccentRose
                        )
                    }

                    Spacer(modifier = Modifier.width(6.dp))

                    // Delete User Button
                    OutlinedButton(
                        onClick = {
                            destructiveActionPrompt = "Permanently delete subscriber '${user.username}'?"
                            pendingDestructiveAction = {
                                scope.launch {
                                    adminRepository.deleteUser(user.username)
                                    Toast.makeText(context, "User deleted", Toast.LENGTH_SHORT).show()
                                    refreshData()
                                }
                            }
                        },
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Delete",
                            tint = AccentRose,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }
        }

        // Pending Orders Section Header
        if (orderList.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "CUSTOMER ORDERS (${orderList.size})",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextMuted,
                    letterSpacing = 1.sp
                )
            }

            items(orderList) { order ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(SurfaceCard)
                        .border(1.dp, BorderDark, RoundedCornerShape(12.dp))
                        .padding(14.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${order.username} (${order.id.ifBlank { "ORD-REF" }})",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "${order.plan} • Status: ${order.status.uppercase()}",
                                    fontSize = 11.sp,
                                    color = if (order.status.equals("approved", true)) AccentEmerald else AccentAmber
                                )
                            }

                            if (order.status.equals("pending", true)) {
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Button(
                                        onClick = {
                                            scope.launch {
                                                adminRepository.approveOrder(order.id)
                                                Toast.makeText(context, "Order approved!", Toast.LENGTH_SHORT).show()
                                                refreshData()
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = AccentEmerald),
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text("Approve", fontSize = 11.sp, color = SurfaceDark, fontWeight = FontWeight.Bold)
                                    }

                                    Button(
                                        onClick = {
                                            scope.launch {
                                                adminRepository.rejectOrder(order.id)
                                                Toast.makeText(context, "Order rejected", Toast.LENGTH_SHORT).show()
                                                refreshData()
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = AccentRose),
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text("Reject", fontSize = 11.sp, color = TextPrimary)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Sign out button
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Button(
                onClick = { onLogout() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = AccentRose.copy(alpha = 0.15f)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Logout,
                    contentDescription = null,
                    tint = AccentRose,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out Staff Session", color = AccentRose, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }

    // Confirmation Dialog for destructive operations
    if (pendingDestructiveAction != null && destructiveActionPrompt != null) {
        DscConfirmationDialog(
            title = "Confirm Admin Action",
            message = destructiveActionPrompt!!,
            onConfirm = {
                val action = pendingDestructiveAction
                pendingDestructiveAction = null
                destructiveActionPrompt = null
                action?.invoke()
            },
            onDismiss = {
                pendingDestructiveAction = null
                destructiveActionPrompt = null
            }
        )
    }
}

@Composable
private fun MetricCard(
    title: String,
    value: String,
    color: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(SurfaceCard)
            .border(1.dp, BorderDark, RoundedCornerShape(12.dp))
            .padding(14.dp)
    ) {
        Column {
            Text(text = title, fontSize = 11.sp, color = TextMuted)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = value, fontSize = 18.sp, fontWeight = FontWeight.Black, color = color)
        }
    }
}
