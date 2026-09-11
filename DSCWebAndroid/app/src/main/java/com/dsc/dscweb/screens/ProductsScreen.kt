package com.dsc.dscweb.screens

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Payment
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.dsc.dscweb.network.NetworkResult
import com.dsc.dscweb.repository.UserRepository
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.net.URL
import java.net.URLEncoder

data class PlanItem(
    val backendId: String,
    val name: String,
    val badge: String,
    val startingPrice: String,
    val basePriceUsd: Int,
    val isExclusive: Boolean = false,
    val isFree: Boolean = false,
    val features: List<String>
)

data class DurationOption(
    val days: Int,
    val label: String,
    val multiplier: Int
)

@Composable
fun ProductsScreen(
    userRepository: UserRepository? = null,
    onNavigateFreePanel: () -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var selectedPlanForCheckout by remember { mutableStateOf<PlanItem?>(null) }
    var selectedDays by remember { mutableIntStateOf(30) }

    var checkoutUsername by remember { mutableStateOf("") }
    var checkoutPassword by remember { mutableStateOf("") }
    var checkoutDiscord by remember { mutableStateOf("") }
    var selectedProofUri by remember { mutableStateOf<Uri?>(null) }
    var proofBase64String by remember { mutableStateOf<String?>(null) }
    var proofBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var isSubmitting by remember { mutableStateOf(false) }

    // System Image Picker for Payment Proof
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        selectedProofUri = uri
        if (uri != null) {
            scope.launch(Dispatchers.IO) {
                try {
                    val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
                    val bitmap = BitmapFactory.decodeStream(inputStream)
                    inputStream?.close()

                    if (bitmap != null) {
                        val outputStream = ByteArrayOutputStream()
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
                        val byteArray = outputStream.toByteArray()
                        val base64 = "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)

                        withContext(Dispatchers.Main) {
                            proofBitmap = bitmap
                            proofBase64String = base64
                            Toast.makeText(context, "Payment proof screenshot attached.", Toast.LENGTH_SHORT).show()
                        }
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "Failed to read image file.", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    // Exact catalog from DSCWeb products.html
    val plans = listOf(
        PlanItem(
            backendId = "free",
            name = "FREE-PANEL",
            badge = "Free Tier",
            startingPrice = "Starting at $0",
            basePriceUsd = 0,
            isFree = true,
            features = listOf(
                "Limited Time Free Access",
                "Basic Core Features",
                "Limited Slot Availability"
            )
        ),
        PlanItem(
            backendId = "streamer",
            name = "STREAMER-PANEL",
            badge = "Streaming Edition",
            startingPrice = "Starting at $10",
            basePriceUsd = 2,
            features = listOf(
                "OBS Safe Overlay Support",
                "Smooth Humanized Gameplay",
                "Safe Main ID Compatibility"
            )
        ),
        PlanItem(
            backendId = "special",
            name = "SPECIAL-PANEL",
            badge = "VIP Tier",
            startingPrice = "Starting at $3",
            basePriceUsd = 3,
            isExclusive = true,
            features = listOf(
                "Private Limited Slots",
                "Advanced Security Layer",
                "HWID Protection",
                "24/7 VIP Dedicated Support"
            )
        ),
        PlanItem(
            backendId = "sniper",
            name = "SNIPER-PANEL",
            badge = "Tactical Tier",
            startingPrice = "Starting at $1",
            basePriceUsd = 1,
            features = listOf(
                "Fast Switch Capabilities",
                "Location Analysis Tools",
                "Advanced Accuracy Optimization"
            )
        ),
        PlanItem(
            backendId = "aimbot",
            name = "AIM-ASSIST-PANEL",
            badge = "Precision Edition",
            startingPrice = "Starting at $1",
            basePriceUsd = 1,
            features = listOf(
                "Advanced Precision Layer",
                "Built-in Protection Shield",
                "Smooth Tracking Module"
            )
        ),
        PlanItem(
            backendId = "premium",
            name = "PREMIUM-PANEL",
            badge = "Next Gen",
            startingPrice = "Starting at $5",
            basePriceUsd = 5,
            features = listOf(
                "All Platform Features Included",
                "Priority Direct Support",
                "Advanced Multi-layer Security"
            )
        ),
        PlanItem(
            backendId = "customised",
            name = "CUSTOMISED-PANEL",
            badge = "Enterprise",
            startingPrice = "Starting at $10",
            basePriceUsd = 10,
            features = listOf(
                "Custom UI, Branding & Logo",
                "Custom Tailored Features",
                "Dedicated Private Build"
            )
        )
    )

    // Exact duration options & multipliers from DSCWeb checkout.html & checkout.js
    val durationOptions = listOf(
        DurationOption(3, "3 Days - Starter", 1),
        DurationOption(7, "7 Days - Weekly", 2),
        DurationOption(15, "15 Days - Standard", 3),
        DurationOption(30, "30 Days - Monthly", 4),
        DurationOption(60, "60 Days - Bi-Monthly", 6),
        DurationOption(365, "365 Days - Yearly", 8)
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceDark),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column {
                Text(
                    text = "Choose Your Plan",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Flexible software tiers for casual, streaming, and competitive environments.",
                    fontSize = 13.sp,
                    color = TextMuted
                )
            }
        }

        items(plans) { plan ->
            val borderColor = if (plan.isExclusive) PrimaryCyan else BorderDark

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceCard)
                    .border(1.dp, borderColor, RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(PrimaryCyan.copy(alpha = 0.12f))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = plan.badge,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryCyan
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = plan.name,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }

                        if (plan.isExclusive) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(SecondaryPurple.copy(alpha = 0.2f))
                                    .border(1.dp, SecondaryPurple, RoundedCornerShape(12.dp))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "EXCLUSIVE",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    color = SecondaryPurple
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = plan.startingPrice,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = PrimaryCyan
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    plan.features.forEach { feat ->
                        Row(
                            modifier = Modifier.padding(vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = PrimaryCyan,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = feat,
                                fontSize = 12.sp,
                                color = TextSecondary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            if (plan.isFree) {
                                onNavigateFreePanel()
                            } else {
                                selectedPlanForCheckout = plan
                                selectedDays = 30
                                proofBase64String = null
                                proofBitmap = null
                                selectedProofUri = null
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (plan.isExclusive) SecondaryPurple else PrimaryCyan
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = if (plan.isFree) "SHOW USER PASS" else "Buy Now",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = if (plan.isExclusive) TextPrimary else SurfaceDark
                        )
                    }
                }
            }
        }
    }

    // Exact Checkout Modal from DSCWeb checkout.html & checkout.js
    if (selectedPlanForCheckout != null) {
        val plan = selectedPlanForCheckout!!
        val selectedOption = durationOptions.find { it.days == selectedDays } ?: durationOptions[3]
        val totalUsd = plan.basePriceUsd * selectedOption.multiplier
        val totalInr = totalUsd * 90
        val priceDisplay = "USD $totalUsd ($totalInr INR)"

        // Exact UPI URL & Payment QR API from checkout.js
        val upiUrl = "upi://pay?pa=naveedmushtaq@ptyes&pn=${URLEncoder.encode("Dark Skull Corp", "UTF-8")}&am=$totalInr&cu=INR&tn=DSC-${plan.backendId}"
        val qrCodeApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${URLEncoder.encode(upiUrl, "UTF-8")}"

        var qrBitmap by remember(qrCodeApiUrl) { mutableStateOf<Bitmap?>(null) }
        var isQrLoading by remember(qrCodeApiUrl) { mutableStateOf(true) }

        // Fetch Payment QR image from server
        LaunchedEffect(qrCodeApiUrl) {
            isQrLoading = true
            withContext(Dispatchers.IO) {
                try {
                    val stream = URL(qrCodeApiUrl).openStream()
                    val b = BitmapFactory.decodeStream(stream)
                    stream.close()
                    withContext(Dispatchers.Main) {
                        qrBitmap = b
                        isQrLoading = false
                    }
                } catch (_: Exception) {
                    withContext(Dispatchers.Main) {
                        isQrLoading = false
                    }
                }
            }
        }

        var dropdownExpanded by remember { mutableStateOf(false) }

        Dialog(onDismissRequest = { selectedPlanForCheckout = null }) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceCard)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = "Complete Your Purchase",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Selected Panel: ${plan.name}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryCyan
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Duration Selector
                Text("Duration", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(SurfaceDark)
                        .border(1.dp, BorderDark, RoundedCornerShape(10.dp))
                        .clickable { dropdownExpanded = true }
                        .padding(horizontal = 14.dp, vertical = 12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(selectedOption.label, fontSize = 13.sp, color = TextPrimary)
                        Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = PrimaryCyan)
                    }

                    DropdownMenu(
                        expanded = dropdownExpanded,
                        onDismissRequest = { dropdownExpanded = false },
                        modifier = Modifier.background(SurfaceCard)
                    ) {
                        durationOptions.forEach { opt ->
                            DropdownMenuItem(
                                text = { Text(opt.label, color = TextPrimary) },
                                onClick = {
                                    selectedDays = opt.days
                                    dropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Price display
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(SurfaceDark)
                        .border(1.dp, BorderDark, RoundedCornerShape(10.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Total Amount Payable", fontSize = 11.sp, color = TextMuted)
                        Text(priceDisplay, fontSize = 14.sp, fontWeight = FontWeight.Black, color = AccentEmerald)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Form Credentials
                OutlinedTextField(
                    value = checkoutUsername,
                    onValueChange = { checkoutUsername = it },
                    label = { Text("Username (Must match game username)", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = checkoutPassword,
                    onValueChange = { checkoutPassword = it },
                    label = { Text("Password (Create a secure password)", color = TextMuted) },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = checkoutDiscord,
                    onValueChange = { checkoutDiscord = it },
                    label = { Text("Discord ID (Optional e.g. username#1234)", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Payment Instructions & Dynamic QR Code Card (matching checkout.html)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(SurfaceDark)
                        .border(1.dp, BorderDark, RoundedCornerShape(12.dp))
                        .padding(14.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.QrCode, contentDescription = null, tint = PrimaryCyan, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Payment Instructions", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Scan the QR code below or click the UPI button to pay exactly $totalInr INR.",
                            fontSize = 11.sp,
                            color = TextMuted,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // QR Image Container
                        Box(
                            modifier = Modifier
                                .size(160.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceCard)
                                .border(1.dp, BorderDark, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isQrLoading) {
                                CircularProgressIndicator(color = PrimaryCyan, modifier = Modifier.size(28.dp), strokeWidth = 2.dp)
                            } else if (qrBitmap != null) {
                                Image(
                                    bitmap = qrBitmap!!.asImageBitmap(),
                                    contentDescription = "Payment QR",
                                    modifier = Modifier.fillMaxSize().padding(8.dp)
                                )
                            } else {
                                Text("Scan to Pay", fontSize = 11.sp, color = TextMuted)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Pay with UPI App Button
                        Button(
                            onClick = {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(upiUrl))
                                    context.startActivity(intent)
                                } catch (_: Exception) {
                                    Toast.makeText(context, "UPI ID: NAVEEDMUSHTAQ@PTYES", Toast.LENGTH_LONG).show()
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Payment, contentDescription = null, tint = SurfaceDark, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Pay with UPI App", fontSize = 12.sp, color = SurfaceDark, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text("UPI ID: NAVEEDMUSHTAQ@PTYES", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = AccentRose)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Payment Proof Screenshot Upload Section (matching checkout.html)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(SurfaceDark)
                        .border(1.dp, BorderDark, RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Upload Payment Proof (Screenshot)", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                                Text(
                                    text = if (selectedProofUri != null) "Screenshot attached" else "Required: Max size 5MB (.png, .jpg)",
                                    fontSize = 11.sp,
                                    color = if (selectedProofUri != null) AccentEmerald else TextMuted
                                )
                            }

                            OutlinedButton(
                                onClick = { imagePickerLauncher.launch("image/*") },
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.Image, contentDescription = null, tint = PrimaryCyan, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(if (selectedProofUri != null) "Change" else "Attach", fontSize = 11.sp, color = PrimaryCyan)
                            }
                        }

                        if (proofBitmap != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Image(
                                bitmap = proofBitmap!!.asImageBitmap(),
                                contentDescription = "Payment Proof Preview",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(120.dp)
                                    .clip(RoundedCornerShape(6.dp))
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(
                        onClick = { selectedPlanForCheckout = null },
                        colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Cancel", color = TextMuted)
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Button(
                        onClick = {
                            if (checkoutUsername.isBlank() || checkoutPassword.isBlank()) {
                                Toast.makeText(context, "Username and password are required.", Toast.LENGTH_SHORT).show()
                                return@Button
                            }

                            if (checkoutPassword.length < 3) {
                                Toast.makeText(context, "Password must be at least 3 characters long.", Toast.LENGTH_SHORT).show()
                                return@Button
                            }

                            if (selectedProofUri == null) {
                                Toast.makeText(context, "Payment proof screenshot is required.", Toast.LENGTH_SHORT).show()
                                return@Button
                            }

                            isSubmitting = true
                            if (userRepository != null) {
                                scope.launch {
                                    val res = userRepository.checkout(
                                        username = checkoutUsername,
                                        password = checkoutPassword,
                                        plan = plan.backendId,
                                        days = selectedDays,
                                        amount = priceDisplay
                                    )
                                    isSubmitting = false
                                    selectedPlanForCheckout = null
                                    when (res) {
                                        is NetworkResult.Success -> {
                                            Toast.makeText(context, "Order submitted successfully! You can now login to track status.", Toast.LENGTH_LONG).show()
                                        }
                                        is NetworkResult.Error -> {
                                            Toast.makeText(context, res.message, Toast.LENGTH_LONG).show()
                                        }
                                        is NetworkResult.Loading -> {}
                                    }
                                }
                            } else {
                                Toast.makeText(context, "Order submitted successfully! Track status from user login.", Toast.LENGTH_LONG).show()
                                isSubmitting = false
                                selectedPlanForCheckout = null
                            }
                        },
                        enabled = !isSubmitting,
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(color = SurfaceDark, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Submit Order for Approval", color = SurfaceDark, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
