package com.dsc.dscweb.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.dsc.dscweb.auth.UserSession
import com.dsc.dscweb.model.AdminAccount
import com.dsc.dscweb.model.AdminKey
import com.dsc.dscweb.model.AdminOrder
import com.dsc.dscweb.model.AdminUser
import com.dsc.dscweb.model.FreeUserRecord
import com.dsc.dscweb.model.PanelUpdateRecord
import com.dsc.dscweb.model.SystemSettings
import com.dsc.dscweb.network.NetworkResult
import com.dsc.dscweb.repository.OwnerRepository
import com.dsc.dscweb.ui.components.DscConfirmationDialog
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

enum class OwnerSection(val label: String) {
    Overview("Overview"),
    Users("Users"),
    Settings("System Settings"),
    GlobalUserPass("Global UserPass"),
    FreeUsers("Free Users"),
    Updates("Updates"),
    Keys("Register Keys"),
    Orders("Orders"),
    Admins("Admin Accounts"),
    Maintenance("Maintenance")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnerControlCenterScreen(
    session: UserSession,
    ownerRepository: OwnerRepository,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Strict Owner check
    if (!session.isOwner) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(SurfaceDark)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceCard)
                    .border(1.dp, AccentRose.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = AccentRose,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(14.dp))
                Text(
                    text = "Access Denied: Owner Privileges Required",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Master Owner authorization missing. Only verified Owner accounts can access the Database Manager.",
                    fontSize = 12.sp,
                    color = TextMuted
                )
                Spacer(modifier = Modifier.height(20.dp))
                Button(
                    onClick = onBack,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan)
                ) {
                    Text("Go Back", color = SurfaceDark, fontWeight = FontWeight.Bold)
                }
            }
        }
        return
    }

    var activeSection by remember { mutableStateOf(OwnerSection.Overview) }
    var searchQuery by remember { mutableStateOf("") }

    // Server State
    var systemSettings by remember { mutableStateOf(SystemSettings()) }
    var usersList by remember { mutableStateOf<List<AdminUser>>(emptyList()) }
    var keysList by remember { mutableStateOf<List<AdminKey>>(emptyList()) }
    var adminsList by remember { mutableStateOf<List<AdminAccount>>(emptyList()) }
    var freeUsersList by remember { mutableStateOf<List<FreeUserRecord>>(emptyList()) }
    var ordersList by remember { mutableStateOf<List<AdminOrder>>(emptyList()) }
    var panelUpdates by remember { mutableStateOf(PanelUpdateRecord()) }
    var isMaintenanceActive by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(true) }

    // Global UserPass Form State
    var userPassUser by remember { mutableStateOf("") }
    var userPassPass by remember { mutableStateOf("") }
    var userPassSlots by remember { mutableStateOf("50") }
    var userPassDays by remember { mutableStateOf("30") }
    var showHomeDownloadBtn by remember { mutableStateOf(false) }

    // System Settings & Links Form State
    var versionText by remember { mutableStateOf("") }
    var updateUrlText by remember { mutableStateOf("") }
    var maintReasonText by remember { mutableStateOf("") }
    var linkFree by remember { mutableStateOf("") }
    var linkStreamer by remember { mutableStateOf("") }
    var linkSniper by remember { mutableStateOf("") }
    var linkSpecial by remember { mutableStateOf("") }
    var linkAimbot by remember { mutableStateOf("") }
    var linkPremium by remember { mutableStateOf("") }
    var linkCustomised by remember { mutableStateOf("") }

    // Panel Updates Form State
    var upd1Text by remember { mutableStateOf("") }
    var upd2Text by remember { mutableStateOf("") }
    var upd3Text by remember { mutableStateOf("") }
    var upd4Text by remember { mutableStateOf("") }

    // Generate Key Form State
    var selectedPlan by remember { mutableStateOf("SPECIAL-PANEL") }
    var durationDays by remember { mutableStateOf("30") }
    var isGeneratingKey by remember { mutableStateOf(false) }

    // Create Admin Form State
    var newAdminUser by remember { mutableStateOf("") }
    var newAdminPass by remember { mutableStateOf("") }

    // Dialog & Edit States
    var editingUser by remember { mutableStateOf<AdminUser?>(null) }
    var editingOrder by remember { mutableStateOf<AdminOrder?>(null) }

    var pendingConfirmationAction by remember { mutableStateOf<(() -> Unit)?>(null) }
    var confirmationDialogPrompt by remember { mutableStateOf<String?>(null) }

    fun refreshAll() {
        scope.launch {
            isLoading = true
            val settingsRes = ownerRepository.getSettings()
            if (settingsRes is NetworkResult.Success) {
                val s = settingsRes.data
                systemSettings = s
                userPassUser = s.freeUsername
                userPassPass = s.freePassword
                userPassSlots = s.maxFreeSlots.toString()
                userPassDays = s.freeValidDays.toString()
                showHomeDownloadBtn = s.showHomeDownloadBtn
                isMaintenanceActive = s.maintenance || s.isMaintenanceMode

                versionText = s.latestVersion
                updateUrlText = s.updateUrl
                maintReasonText = s.maintenanceReason

                linkFree = s.freeLink
                linkStreamer = s.streamerLink
                linkSniper = s.sniperLink
                linkSpecial = s.specialLink
                linkAimbot = s.aimbotLink
                linkPremium = s.premiumLink
                linkCustomised = s.customisedLink
            }

            usersList = ownerRepository.getUsers().getOrNull() ?: emptyList()
            keysList = ownerRepository.fetchKeys().getOrNull() ?: emptyList()
            adminsList = ownerRepository.fetchAdmins().getOrNull() ?: emptyList()
            freeUsersList = ownerRepository.getFreeUsers().getOrNull() ?: emptyList()
            ordersList = ownerRepository.getAllOrders().getOrNull() ?: emptyList()

            val updRes = ownerRepository.getPanelUpdates()
            if (updRes is NetworkResult.Success) {
                panelUpdates = updRes.data
                upd1Text = updRes.data.update1
                upd2Text = updRes.data.update2
                upd3Text = updRes.data.update3
                upd4Text = updRes.data.update4
            }

            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshAll()
    }

    fun copyText(label: String, text: String) {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText(label, text)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(context, "$label copied to clipboard", Toast.LENGTH_SHORT).show()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceDark),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Master Header
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceCard)
                    .border(1.dp, SecondaryPurple, RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(SecondaryPurple.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = SecondaryPurple,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Owner Control Center",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = TextPrimary
                        )
                        Text(
                            text = "Database Manager • ${session.username}",
                            fontSize = 12.sp,
                            color = SecondaryPurple
                        )
                    }

                    OutlinedButton(
                        onClick = { refreshAll() },
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

        // Section Navigation Tabs
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OwnerSection.entries.forEach { section ->
                    val isSelected = activeSection == section
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isSelected) SecondaryPurple else SurfaceCard)
                            .border(1.dp, if (isSelected) SecondaryPurple else BorderDark, RoundedCornerShape(12.dp))
                            .clickable {
                                activeSection = section
                                searchQuery = ""
                            }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = section.label,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) TextPrimary else TextMuted
                        )
                    }
                }
            }
        }

        // Section Content Rendering
        when (activeSection) {
            OwnerSection.Overview -> {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            MetricCard("Subscribers", usersList.size.toString(), PrimaryCyan, Modifier.weight(1f))
                            MetricCard("Free Slots", "${freeUsersList.size}/${systemSettings.maxFreeSlots}", AccentEmerald, Modifier.weight(1f))
                            MetricCard("Total Orders", ordersList.size.toString(), SecondaryPurple, Modifier.weight(1f))
                        }

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(SurfaceCard)
                                .border(1.dp, BorderDark, RoundedCornerShape(14.dp))
                                .padding(16.dp)
                        ) {
                            Column {
                                Text("System Status & Overview", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Spacer(modifier = Modifier.height(10.dp))
                                Text("Maintenance Mode: ${if (isMaintenanceActive) "LOCKED (Active)" else "OPERATIONAL (Live)"}", fontSize = 12.sp, color = if (isMaintenanceActive) AccentRose else AccentEmerald, fontWeight = FontWeight.Bold)
                                Text("Shared Free Username: ${systemSettings.freeUsername.ifBlank { "Not Set" }}", fontSize = 12.sp, color = TextMuted)
                                Text("Shared Free Password: ${systemSettings.freePassword.ifBlank { "Not Set" }}", fontSize = 12.sp, color = TextMuted)
                                Text("Total Register Keys: ${keysList.size}", fontSize = 12.sp, color = TextMuted)
                                Text("Total Staff Admins: ${adminsList.size}", fontSize = 12.sp, color = TextMuted)
                            }
                        }
                    }
                }
            }

            OwnerSection.Users -> {
                item {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search username, plan, or HWID...", color = TextMuted, fontSize = 13.sp) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        singleLine = true
                    )
                }

                val filtered = usersList.filter {
                    searchQuery.isBlank() ||
                            it.username.contains(searchQuery, ignoreCase = true) ||
                            it.plan.contains(searchQuery, ignoreCase = true) ||
                            (it.hwid ?: "").contains(searchQuery, ignoreCase = true)
                }

                items(filtered) { u ->
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
                                Text(u.username, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text("Plan: ${u.plan} • Expiry: ${u.expiry.take(10)} • ${if (u.isBanned) "BANNED" else "ACTIVE"}", fontSize = 11.sp, color = if (u.isBanned) AccentRose else TextMuted)
                            }

                            OutlinedButton(
                                onClick = { editingUser = u },
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Icon(Icons.Default.Edit, contentDescription = "Edit", tint = PrimaryCyan, modifier = Modifier.size(12.dp))
                            }

                            Spacer(modifier = Modifier.width(6.dp))

                            OutlinedButton(
                                onClick = {
                                    confirmationDialogPrompt = "Permanently delete user '${u.username}' from database?"
                                    pendingConfirmationAction = {
                                        scope.launch {
                                            ownerRepository.deleteUser(u.id)
                                            refreshAll()
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = AccentRose, modifier = Modifier.size(12.dp))
                            }
                        }
                    }
                }
            }

            OwnerSection.Settings -> {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(SurfaceCard)
                            .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                            .padding(20.dp)
                    ) {
                        Column {
                            Text("System Configuration & Links", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Spacer(modifier = Modifier.height(14.dp))

                            OutlinedTextField(
                                value = versionText,
                                onValueChange = { versionText = it },
                                label = { Text("Latest App Version", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            OutlinedTextField(
                                value = updateUrlText,
                                onValueChange = { updateUrlText = it },
                                label = { Text("App Update Download URL", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            OutlinedTextField(
                                value = maintReasonText,
                                onValueChange = { maintReasonText = it },
                                label = { Text("Custom Maintenance Reason", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(16.dp))
                            Text("Panel Download Links", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = PrimaryCyan)
                            Spacer(modifier = Modifier.height(10.dp))

                            LinkField("Free Panel Link", linkFree) { linkFree = it }
                            LinkField("Streamer Panel Link", linkStreamer) { linkStreamer = it }
                            LinkField("Sniper Panel Link", linkSniper) { linkSniper = it }
                            LinkField("Special Panel Link", linkSpecial) { linkSpecial = it }
                            LinkField("Aimbot Panel Link", linkAimbot) { linkAimbot = it }
                            LinkField("Premium Panel Link", linkPremium) { linkPremium = it }
                            LinkField("Customised Panel Link", linkCustomised) { linkCustomised = it }

                            Spacer(modifier = Modifier.height(16.dp))

                            Button(
                                onClick = {
                                    scope.launch {
                                        val updated = systemSettings.copy(
                                            latestVersion = versionText,
                                            updateUrl = updateUrlText,
                                            maintenanceReason = maintReasonText,
                                            freeLink = linkFree,
                                            streamerLink = linkStreamer,
                                            sniperLink = linkSniper,
                                            specialLink = linkSpecial,
                                            aimbotLink = linkAimbot,
                                            premiumLink = linkPremium,
                                            customisedLink = linkCustomised
                                        )
                                        val res = ownerRepository.updateSettings(updated)
                                        when (res) {
                                            is NetworkResult.Success -> Toast.makeText(context, "System settings saved!", Toast.LENGTH_SHORT).show()
                                            is NetworkResult.Error -> Toast.makeText(context, res.message, Toast.LENGTH_LONG).show()
                                            is NetworkResult.Loading -> {}
                                        }
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Save System Settings", color = SurfaceDark, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            OwnerSection.GlobalUserPass -> {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(SurfaceCard)
                            .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                            .padding(20.dp)
                    ) {
                        Column {
                            Text("Set Global Free Credentials", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Spacer(modifier = Modifier.height(14.dp))

                            OutlinedTextField(
                                value = userPassUser,
                                onValueChange = { userPassUser = it },
                                label = { Text("Shared Free Username", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            OutlinedTextField(
                                value = userPassPass,
                                onValueChange = { userPassPass = it },
                                label = { Text("Shared Free Password", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            OutlinedTextField(
                                value = userPassSlots,
                                onValueChange = { userPassSlots = it },
                                label = { Text("Max Concurrent Free Slots", color = TextMuted) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(
                                    checked = showHomeDownloadBtn,
                                    onCheckedChange = { showHomeDownloadBtn = it },
                                    colors = CheckboxDefaults.colors(checkedColor = PrimaryCyan)
                                )
                                Text("Show Download Button on Home Page", fontSize = 12.sp, color = TextPrimary)
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            Button(
                                onClick = {
                                    val slots = userPassSlots.toIntOrNull() ?: 50
                                    scope.launch {
                                        val updated = systemSettings.copy(
                                            freeUsername = userPassUser.trim(),
                                            freePassword = userPassPass,
                                            maxFreeSlots = slots,
                                            freeValidDays = userPassDays.toIntOrNull() ?: 30,
                                            showHomeDownloadBtn = showHomeDownloadBtn
                                        )
                                        val res = ownerRepository.updateSettings(updated)
                                        when (res) {
                                            is NetworkResult.Success -> Toast.makeText(context, "Global Free credentials saved!", Toast.LENGTH_SHORT).show()
                                            is NetworkResult.Error -> Toast.makeText(context, res.message, Toast.LENGTH_LONG).show()
                                            is NetworkResult.Loading -> {}
                                        }
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = SecondaryPurple),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Save Global Credentials", color = TextPrimary, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            OwnerSection.FreeUsers -> {
                item {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search Free User by username, HWID, or PC Name...", color = TextMuted, fontSize = 13.sp) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        singleLine = true
                    )
                }

                val filtered = freeUsersList.filter {
                    searchQuery.isBlank() ||
                            it.username.contains(searchQuery, ignoreCase = true) ||
                            (it.hwid ?: "").contains(searchQuery, ignoreCase = true) ||
                            (it.envName ?: "").contains(searchQuery, ignoreCase = true)
                }

                items(filtered) { freeUser ->
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
                                Text(freeUser.username, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text("HWID: ${freeUser.hwid ?: "N/A"} • PC: ${freeUser.envName ?: "Unknown"}", fontSize = 11.sp, color = TextMuted)
                            }
                            OutlinedButton(
                                onClick = {
                                    confirmationDialogPrompt = "Clear free user slot for '${freeUser.username}'?"
                                    pendingConfirmationAction = {
                                        scope.launch {
                                            ownerRepository.deleteFreeUser(freeUser.id)
                                            refreshAll()
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Clear Slot", tint = AccentRose, modifier = Modifier.size(12.dp))
                            }
                        }
                    }
                }
            }

            OwnerSection.Updates -> {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(SurfaceCard)
                            .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                            .padding(20.dp)
                    ) {
                        Column {
                            Text("Panel Module Updates Status", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Spacer(modifier = Modifier.height(14.dp))

                            OutlinedTextField(
                                value = upd1Text,
                                onValueChange = { upd1Text = it },
                                label = { Text("Aimbot Status", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            OutlinedTextField(
                                value = upd2Text,
                                onValueChange = { upd2Text = it },
                                label = { Text("Sniper Status", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            OutlinedTextField(
                                value = upd3Text,
                                onValueChange = { upd3Text = it },
                                label = { Text("Bypass Status", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            OutlinedTextField(
                                value = upd4Text,
                                onValueChange = { upd4Text = it },
                                label = { Text("General Status", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            Button(
                                onClick = {
                                    scope.launch {
                                        val res = ownerRepository.savePanelUpdates(upd1Text, upd2Text, upd3Text, upd4Text)
                                        when (res) {
                                            is NetworkResult.Success -> Toast.makeText(context, "Panel updates saved!", Toast.LENGTH_SHORT).show()
                                            is NetworkResult.Error -> Toast.makeText(context, res.message, Toast.LENGTH_LONG).show()
                                            is NetworkResult.Loading -> {}
                                        }
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Save Panel Updates", color = SurfaceDark, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            OwnerSection.Keys -> {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(SurfaceCard)
                            .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                            .padding(20.dp)
                    ) {
                        Column {
                            Text("VIP License Key Generator", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Spacer(modifier = Modifier.height(14.dp))

                            OutlinedTextField(
                                value = selectedPlan,
                                onValueChange = { selectedPlan = it },
                                label = { Text("Plan Name (e.g. SPECIAL-PANEL)", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            OutlinedTextField(
                                value = durationDays,
                                onValueChange = { durationDays = it },
                                label = { Text("Valid Days", color = TextMuted) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            Button(
                                onClick = {
                                    val days = durationDays.toIntOrNull() ?: 30
                                    isGeneratingKey = true
                                    scope.launch {
                                        val res = ownerRepository.generateKey(selectedPlan, days)
                                        isGeneratingKey = false
                                        when (res) {
                                            is NetworkResult.Success -> {
                                                Toast.makeText(context, "Key Generated!", Toast.LENGTH_SHORT).show()
                                                refreshAll()
                                            }
                                            is NetworkResult.Error -> Toast.makeText(context, res.message, Toast.LENGTH_LONG).show()
                                            is NetworkResult.Loading -> {}
                                        }
                                    }
                                },
                                enabled = !isGeneratingKey,
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text(if (isGeneratingKey) "Generating..." else "Generate License Key", color = SurfaceDark, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                items(keysList) { keyRec ->
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
                                Text(keyRec.key, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = PrimaryCyan)
                                Text("${keyRec.plan} • ${keyRec.durationDays} Days • Status: ${if (keyRec.isUsed) "USED" else "UNUSED"}", fontSize = 11.sp, color = TextMuted)
                            }
                            OutlinedButton(onClick = { copyText("License Key", keyRec.key) }, shape = RoundedCornerShape(6.dp)) {
                                Icon(Icons.Default.ContentCopy, contentDescription = null, tint = PrimaryCyan, modifier = Modifier.size(12.dp))
                            }
                            Spacer(modifier = Modifier.width(6.dp))
                            OutlinedButton(
                                onClick = {
                                    confirmationDialogPrompt = "Delete key '${keyRec.key}'?"
                                    pendingConfirmationAction = {
                                        scope.launch {
                                            ownerRepository.deleteKey(keyRec.id.ifBlank { keyRec.key })
                                            refreshAll()
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = null, tint = AccentRose, modifier = Modifier.size(12.dp))
                            }
                        }
                    }
                }
            }

            OwnerSection.Orders -> {
                item {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search Orders by username or status...", color = TextMuted, fontSize = 13.sp) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        singleLine = true
                    )
                }

                val filtered = ordersList.filter {
                    searchQuery.isBlank() ||
                            it.username.contains(searchQuery, ignoreCase = true) ||
                            it.status.contains(searchQuery, ignoreCase = true)
                }

                items(filtered) { order ->
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
                                Text("${order.username} (${order.plan})", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text("Days: ${order.days} • Price: ${order.amount.ifBlank { order.price }} • Status: ${order.status.uppercase()}", fontSize = 11.sp, color = TextMuted)
                            }

                            if (order.status.equals("pending", true)) {
                                Button(
                                    onClick = {
                                        scope.launch {
                                            ownerRepository.updateOrder(order.copy(status = "Approved"))
                                            refreshAll()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = AccentEmerald),
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text("Approve", fontSize = 11.sp, color = SurfaceDark, fontWeight = FontWeight.Bold)
                                }
                            }

                            Spacer(modifier = Modifier.width(6.dp))

                            OutlinedButton(
                                onClick = {
                                    confirmationDialogPrompt = "Delete order record #${order.id}?"
                                    pendingConfirmationAction = {
                                        scope.launch {
                                            ownerRepository.deleteOrder(order.id)
                                            refreshAll()
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = null, tint = AccentRose, modifier = Modifier.size(12.dp))
                            }
                        }
                    }
                }
            }

            OwnerSection.Admins -> {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(SurfaceCard)
                            .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                            .padding(20.dp)
                    ) {
                        Column {
                            Text("Create Staff Administrator", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Spacer(modifier = Modifier.height(10.dp))
                            OutlinedTextField(value = newAdminUser, onValueChange = { newAdminUser = it }, label = { Text("Admin Username", color = TextMuted) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp), singleLine = true)
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(value = newAdminPass, onValueChange = { newAdminPass = it }, label = { Text("Admin Password", color = TextMuted) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp), singleLine = true)
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = {
                                    if (newAdminUser.isNotBlank() && newAdminPass.isNotBlank()) {
                                        scope.launch {
                                            val res = ownerRepository.createAdmin(newAdminUser, newAdminPass)
                                            when (res) {
                                                is NetworkResult.Success<*> -> {
                                                    Toast.makeText(context, "Admin Created!", Toast.LENGTH_SHORT).show()
                                                    newAdminUser = ""
                                                    newAdminPass = ""
                                                    refreshAll()
                                                }
                                                is NetworkResult.Error -> Toast.makeText(context, res.message, Toast.LENGTH_LONG).show()
                                                is NetworkResult.Loading -> {}
                                            }
                                        }
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = SecondaryPurple),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Create Admin Account", color = TextPrimary, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                items(adminsList) { adm ->
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
                                Text(adm.username, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Text("Role: ${adm.role} • Active: ${adm.isActive}", fontSize = 11.sp, color = TextMuted)
                            }
                            OutlinedButton(
                                onClick = {
                                    confirmationDialogPrompt = "Revoke admin account '${adm.username}'?"
                                    pendingConfirmationAction = {
                                        scope.launch {
                                            ownerRepository.deleteAdmin(adm.id)
                                            refreshAll()
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = null, tint = AccentRose, modifier = Modifier.size(12.dp))
                            }
                        }
                    }
                }
            }

            OwnerSection.Maintenance -> {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(SurfaceCard)
                            .border(1.dp, BorderDark, RoundedCornerShape(14.dp))
                            .padding(16.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Global Maintenance Mode",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = if (isMaintenanceActive) "System is LOCKED. Only Owner can connect." else "System operational for all users.",
                                    fontSize = 11.sp,
                                    color = if (isMaintenanceActive) AccentRose else AccentEmerald
                                )
                            }

                            Switch(
                                checked = isMaintenanceActive,
                                onCheckedChange = { checked ->
                                    confirmationDialogPrompt = if (checked) "Enable Maintenance Mode? All subscriber traffic will be blocked." else "Disable Maintenance Mode?"
                                    pendingConfirmationAction = {
                                        scope.launch {
                                            val res = ownerRepository.toggleMaintenance(checked)
                                            if (res is NetworkResult.Success) {
                                                isMaintenanceActive = res.data
                                                Toast.makeText(context, "Maintenance status updated", Toast.LENGTH_SHORT).show()
                                            } else if (res is NetworkResult.Error) {
                                                Toast.makeText(context, res.message, Toast.LENGTH_LONG).show()
                                            }
                                        }
                                    }
                                },
                                colors = SwitchDefaults.colors(checkedThumbColor = SurfaceDark, checkedTrackColor = AccentRose)
                            )
                        }
                    }
                }
            }
        }

        // Return button
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Button(
                onClick = onBack,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Return to Command Center", color = TextMuted)
            }
        }
    }

    // User Edit Dialog
    if (editingUser != null) {
        val u = editingUser!!
        var editPlan by remember { mutableStateOf(u.plan) }
        var editExpiry by remember { mutableStateOf(u.expiry) }
        var editIsBanned by remember { mutableStateOf(u.isBanned) }

        Dialog(onDismissRequest = { editingUser = null }) {
            Column(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceCard)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Text("Edit Subscriber: ${u.username}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = editPlan,
                    onValueChange = { editPlan = it },
                    label = { Text("Plan", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = editExpiry,
                    onValueChange = { editExpiry = it },
                    label = { Text("Expiry (ISO Date)", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = editIsBanned,
                        onCheckedChange = { editIsBanned = it },
                        colors = CheckboxDefaults.colors(checkedColor = AccentRose)
                    )
                    Text("Ban Account", fontSize = 12.sp, color = TextPrimary)
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    Button(onClick = { editingUser = null }, colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark)) {
                        Text("Cancel", color = TextMuted)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            scope.launch {
                                val updated = u.copy(
                                    plan = editPlan,
                                    expiry = editExpiry,
                                    status = if (editIsBanned) "banned" else "active"
                                )
                                ownerRepository.updateUser(updated)
                                editingUser = null
                                refreshAll()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan)
                    ) {
                        Text("Save Changes", color = SurfaceDark, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Confirmation dialog
    if (pendingConfirmationAction != null && confirmationDialogPrompt != null) {
        DscConfirmationDialog(
            title = "Confirm Owner Operation",
            message = confirmationDialogPrompt!!,
            onConfirm = {
                val action = pendingConfirmationAction
                pendingConfirmationAction = null
                confirmationDialogPrompt = null
                action?.invoke()
            },
            onDismiss = {
                pendingConfirmationAction = null
                confirmationDialogPrompt = null
            }
        )
    }
}

@Composable
private fun MetricCard(
    title: String,
    value: String,
    color: Color,
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

@Composable
private fun LinkField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit
) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label, color = TextMuted) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextPrimary, unfocusedTextColor = TextPrimary),
            singleLine = true
        )
    }
}
