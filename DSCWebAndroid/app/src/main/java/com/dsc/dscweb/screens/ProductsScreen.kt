package com.dsc.dscweb.screens

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.window.Dialog
import com.dsc.dscweb.ui.theme.AccentAmber
import com.dsc.dscweb.ui.theme.BorderDark
import com.dsc.dscweb.ui.theme.PrimaryCyan
import com.dsc.dscweb.ui.theme.SecondaryPurple
import com.dsc.dscweb.ui.theme.SurfaceCard
import com.dsc.dscweb.ui.theme.SurfaceDark
import com.dsc.dscweb.ui.theme.TextMuted
import com.dsc.dscweb.ui.theme.TextPrimary
import com.dsc.dscweb.ui.theme.TextSecondary
import kotlinx.coroutines.launch

data class PlanItem(
    val id: String,
    val name: String,
    val price: String,
    val duration: String,
    val isPopular: Boolean = false,
    val features: List<String>
)

@Composable
fun ProductsScreen() {
    val context = LocalContext.current
    var selectedPlanForCheckout by remember { mutableStateOf<PlanItem?>(null) }
    var checkoutUsername by remember { mutableStateOf("") }
    var checkoutEmail by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    val plans = listOf(
        PlanItem(
            id = "plan_silver",
            name = "Silver Regular",
            price = "$19.99",
            duration = "14 Days Access",
            features = listOf(
                "Standard Kernel Bypass",
                "Heuristic Memory Protection",
                "Single Device License",
                "Community Discord Support"
            )
        ),
        PlanItem(
            id = "plan_gold",
            name = "Gold VIP",
            price = "$49.99",
            duration = "30 Days Access",
            isPopular = true,
            features = listOf(
                "Full Kernel Bypass + Ring-0 Modules",
                "Real-time Automated Updates",
                "Priority HWID Auto-Rebind",
                "VIP Ticket & Telegram Desk"
            )
        ),
        PlanItem(
            id = "plan_platinum",
            name = "Platinum Elite",
            price = "$99.99",
            duration = "90 Days Extended",
            features = listOf(
                "Zero-Trace Anti-Cheat Shield",
                "Custom Memory Signatures",
                "Dual Device Registration",
                "Direct Developer Support Channel"
            )
        )
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceDark)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column {
                Text(
                    text = "Official VIP Subscriptions",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Select your desired security tier. Orders are processed via DSCAuth backend.",
                    fontSize = 13.sp,
                    color = TextMuted
                )
            }
        }

        items(plans) { plan ->
            val borderColor = if (plan.isPopular) PrimaryCyan else BorderDark

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
                            Text(
                                text = plan.name,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = plan.duration,
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }

                        if (plan.isPopular) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(PrimaryCyan.copy(alpha = 0.15f))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "MOST POPULAR",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryCyan
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = plan.price,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Black,
                        color = PrimaryCyan
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Features list
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
                        onClick = { selectedPlanForCheckout = plan },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (plan.isPopular) PrimaryCyan else SecondaryPurple
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = "Subscribe Now",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = SurfaceDark
                        )
                    }
                }
            }
        }
    }

    // Checkout Dialog
    if (selectedPlanForCheckout != null) {
        val plan = selectedPlanForCheckout!!
        Dialog(onDismissRequest = { selectedPlanForCheckout = null }) {
            Column(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceCard)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Text(
                    text = "Checkout - ${plan.name}",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Total Price: ${plan.price} (${plan.duration})",
                    fontSize = 13.sp,
                    color = PrimaryCyan,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = checkoutUsername,
                    onValueChange = { checkoutUsername = it },
                    label = { Text("Account Username", color = TextMuted) },
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
                    value = checkoutEmail,
                    onValueChange = { checkoutEmail = it },
                    label = { Text("Contact Email / Discord", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    singleLine = true
                )

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
                            if (checkoutUsername.isBlank()) {
                                Toast.makeText(context, "Please enter username", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            isSubmitting = true
                            Toast.makeText(
                                context,
                                "Order for ${plan.name} submitted successfully! Awaiting verification.",
                                Toast.LENGTH_LONG
                            ).show()
                            selectedPlanForCheckout = null
                            isSubmitting = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Submit Order", color = SurfaceDark, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
