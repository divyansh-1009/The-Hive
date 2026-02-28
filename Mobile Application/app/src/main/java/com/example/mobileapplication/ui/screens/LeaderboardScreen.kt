package com.example.mobileapplication.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mobileapplication.model.LeaderboardEntry
import com.example.mobileapplication.network.MetricsApiClient
import com.example.mobileapplication.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private val TIER_COLORS = mapOf(
    "DIAMOND" to Color(0xFFB9F2FF),
    "PLATINUM" to Color(0xFFE5E4E2),
    "GOLD" to Color(0xFFFFD700),
    "SILVER" to Color(0xFFC0C0C0),
    "BRONZE" to Color(0xFFCD7F32)
)

@Composable
fun LeaderboardScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current

    var entries by remember { mutableStateOf<List<LeaderboardEntry>?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        val result = withContext(Dispatchers.IO) {
            MetricsApiClient.getLeaderboard(context)
        }
        entries = result?.take(10)
        isLoading = false
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // ── Top bar ──────────────────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DarkNavbar)
                    .padding(horizontal = 20.dp, vertical = 18.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = buildAnnotatedString {
                        withStyle(SpanStyle(color = OnDark, fontWeight = FontWeight.Bold, fontSize = 20.sp)) {
                            append("THE ")
                        }
                        withStyle(SpanStyle(color = YellowGreen, fontWeight = FontWeight.Bold, fontSize = 20.sp)) {
                            append("HIVE")
                        }
                    }
                )
                OutlinedButton(
                    onClick = onBack,
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, DarkDivider),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text("← Back", color = OnDarkMuted, fontSize = 13.sp)
                }
            }

            // ── Content ──────────────────────────────────────────────────────
            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = CyanBlue, strokeWidth = 3.dp)
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 16.dp)
                ) {
                    // Header
                    Text(
                        text = "Leaderboard",
                        color = OnDark,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Top 10 users by rating",
                        color = OnDarkMuted,
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(20.dp))

                    if (entries.isNullOrEmpty()) {
                        Text(
                            "No leaderboard data available yet.",
                            color = OnDarkMuted,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(top = 40.dp),
                            textAlign = TextAlign.Center
                        )
                    } else {
                        entries!!.forEachIndexed { index, entry ->
                            LeaderboardRow(entry, isTop3 = index < 3)
                            if (index < entries!!.lastIndex) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 2.dp)
                                        .height(1.dp)
                                        .background(DarkDivider)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}

@Composable
private fun LeaderboardRow(entry: LeaderboardEntry, isTop3: Boolean) {
    val tierColor = TIER_COLORS[entry.tier] ?: TIER_COLORS["BRONZE"]!!

    val rankDisplay = when (entry.rank) {
        1 -> "🥇"
        2 -> "🥈"
        3 -> "🥉"
        else -> "#${entry.rank}"
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (isTop3) DarkSurface else Color.Transparent,
                RoundedCornerShape(12.dp)
            )
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Rank
        Text(
            text = rankDisplay,
            color = if (isTop3) YellowGreen else OnDarkMuted,
            fontSize = if (isTop3) 22.sp else 16.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(44.dp),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.width(12.dp))

        // Name + tier
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = entry.name ?: "Anonymous",
                color = OnDark,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(2.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .background(tierColor.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = entry.tier,
                        color = tierColor,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                if (entry.streak > 0) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${entry.streak} 🔥",
                        color = OnDarkMuted,
                        fontSize = 11.sp
                    )
                }
            }
        }

        // Rating
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = String.format("%.2f", entry.displayRating),
                color = CyanBlue,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "rating",
                color = OnDarkMuted,
                fontSize = 10.sp
            )
        }
    }
}
