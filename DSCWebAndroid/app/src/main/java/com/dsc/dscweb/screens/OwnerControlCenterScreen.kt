package com.dsc.dscweb.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PowerSettingsNew
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dsc.dscweb.auth.UserSession
import com.dsc.dscweb.model.AdminAccount
import com.dsc.dscweb.model.KeyRecord
import com.dsc.dscweb.model.UserPassSettings
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnerControlCenterScreen(
    session: UserSession,
    ownerRepository: OwnerRepository,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // 1. Strict Owner authorization check
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
                horizontalAlignment = Alignment.CenterVertically
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
                    text = "Aapke token me Owner permissions nahi hai. Sirf backend verified master credentials yahan access kar sakte hain.",
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

    // State
    var keysList by remember { mutableStateOf<List<KeyRecord>>(emptyList()) }
    var adminsList by remember { mutableStateOf<List<AdminAccount>>(emptyList()) }
    var isMaintenanceActive by remember { mutableStateOf(false) }

    // Key creation form
    var selectedPlan by remember { mutableStateOf("Gold VIP Plan") }
    var durationDays by remember { mutableStateOf("30") }
    var newlyCreatedKey by remember { mutableStateOf<String?>(null) }
    var isGeneratingKey by remember { mutableStateOf(false) }

    // UserPass Settings form
    var userPassUser by remember { mutableStateOf("dsc_free_user") }
    var userPassPass by remember { mutableStateOf("DSC_FreePass_2026") }
    var userPassSlots by remember { mutableStateOf("50") }

    // Dialog state
    var pendingConfirmationAction by remember { mutableStateOf<(() -> Unit)?>(null) }
    var confirmationDialogPrompt by remember { mutableStateOf<String?>(null) }

    fun refreshAll() {
        scope.launch {
            val keys = ownerRepository.fetchKeys().getOrNull() ?: emptyList()
            val admins = ownerRepository.fetchAdmins().getOrNull() ?: emptyList()
            keysList = keys
            adminsList = admins
        }
    }

    LaunchedEffect(Unit) {
        refreshAll()
    }

    fun copyKey(key: String) {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText("Key", key)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(context, "Key copied to clipboard", Toast.LENGTH_SHORT).show()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceDark)
            .padding(horizontal = 16.dp, vertical = 12.dp),
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
                            text = "Root Administrative Clearance • ${session.username}",
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

        // Maintenance Mode Master Toggle
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
                            confirmationDialogPrompt = if (checked) {
                                "Enable Maintenance Mode? All subscriber traffic will be blocked."
                            } else {
                                "Disable Maintenance Mode? Restores subscriber traffic."
                            }
                            pendingConfirmationAction = {
                                scope.launch {
                                    ownerRepository.toggleMaintenance(checked)
                                    isMaintenanceActive = checked
                                    Toast.makeText(context, "Maintenance mode updated", Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = SurfaceDark,
                            checkedTrackColor = AccentRose
                        )
                    )
                }
            }
        }

        // VIP License Key Generator Card
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
                    Text(
                        text = "VIP License Key Generator",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = selectedPlan,
                        onValueChange = { selectedPlan = it },
                        label = { Text("Subscription Plan", color = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = durationDays,
                        onValueChange = { durationDays = it },
                        label = { Text("Duration (Days)", color = TextMuted) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            val days = durationDays.toIntOrNull() ?: 30
                            isGeneratingKey = true
                            scope.launch {
                                val res = ownerRepository.createKey(selectedPlan, days)
                                isGeneratingKey = false
                                res.onSuccess { generatedKey ->
                                    newlyCreatedKey = generatedKey
                                    Toast.makeText(context, "Key Generated!", Toast.LENGTH_SHORT).show()
                                    refreshAll()
                                }
                            }
                        },
                        enabled = !isGeneratingKey,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = if (isGeneratingKey) "Generating..." else "Generate VIP Key",
                            color = SurfaceDark,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }

                    if (newlyCreatedKey != null) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceDark)
                                .border(1.dp, PrimaryCyan, RoundedCornerShape(8.dp))
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("NEWLY GENERATED KEY", fontSize = 9.sp, color = AccentEmerald, fontWeight = FontWeight.Bold)
                                Text(
                                    text = newlyCreatedKey!!,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryCyan
                                )
                            }
                            OutlinedButton(
                                onClick = { copyKey(newlyCreatedKey!!) },
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Icon(Icons.Default.ContentCopy, contentDescription = null, tint = PrimaryCyan, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                }
            }
        }

        // Global Free UserPass Configuration
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
                    Text(
                        text = "Global Free Panel Credentials",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = userPassUser,
                        onValueChange = { userPassUser = it },
                        label = { Text("Shared Username", color = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = userPassPass,
                        onValueChange = { userPassPass = it },
                        label = { Text("Shared Password", color = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = userPassSlots,
                        onValueChange = { userPassSlots = it },
                        label = { Text("Total Concurrent Slots", color = TextMuted) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            val slots = userPassSlots.toIntOrNull() ?: 50
                            scope.launch {
                                ownerRepository.updateUserPass(userPassUser, userPassPass, slots)
                                Toast.makeText(context, "Free credentials updated!", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = SecondaryPurple),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Save Panel Credentials", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Key Database Header
        item {
            Text(
                text = "ACTIVE LICENSE KEYS (${keysList.size})",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextMuted,
                letterSpacing = 1.sp
            )
        }

        // Keys List
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
                        Text(
                            text = keyRec.key,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryCyan
                        )
                        Text(
                            text = "${keyRec.plan} • ${keyRec.durationDays} Days • Status: ${keyRec.status.uppercase()}",
                            fontSize = 11.sp,
                            color = if (keyRec.status.equals("unused", true)) AccentEmerald else TextMuted
                        )
                    }

                    OutlinedButton(
                        onClick = { copyKey(keyRec.key) },
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, tint = PrimaryCyan, modifier = Modifier.size(12.dp))
                    }

                    Spacer(modifier = Modifier.width(6.dp))

                    OutlinedButton(
                        onClick = {
                            confirmationDialogPrompt = "Delete license key '${keyRec.key}'?"
                            pendingConfirmationAction = {
                                scope.launch {
                                    ownerRepository.deleteKey(keyRec.key)
                                    Toast.makeText(context, "Key deleted", Toast.LENGTH_SHORT).show()
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

        // Admin Accounts Header
        item {
            Text(
                text = "STAFF ADMINISTRATORS (${adminsList.size})",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextMuted,
                letterSpacing = 1.sp
            )
        }

        // Admins List
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
                        Text(
                            text = adm.username,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Created: ${adm.createdAt.take(10)} • Role: Staff Admin",
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                    }

                    OutlinedButton(
                        onClick = {
                            confirmationDialogPrompt = "Revoke and delete admin account '${adm.username}'?"
                            pendingConfirmationAction = {
                                scope.launch {
                                    ownerRepository.deleteAdmin(adm.username)
                                    Toast.makeText(context, "Admin account revoked", Toast.LENGTH_SHORT).show()
                                    refreshAll()
                                }
                            }
                        },
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, tint = AccentRose, modifier = Modifier.size(14.dp))
                    }
                }
            }
        }

        // Return button
        item {
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
