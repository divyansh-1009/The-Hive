package com.example.mobileapplication.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mobileapplication.model.DomainRankingsResponse
import com.example.mobileapplication.model.RatingResponse
import com.example.mobileapplication.model.ScoreResponse
import com.example.mobileapplication.network.MetricsApiClient
import com.example.mobileapplication.network.TokenManager
import com.example.mobileapplication.network.UsageApiClient
import com.example.mobileapplication.ui.theme.*
import com.example.mobileapplication.usage.UsageStatsHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.math.roundToInt

// ── Category display helpers ─────────────────────────────────────────────────

private val CATEGORY_LABELS = mapOf(
    "DEV" to "Development",
    "CP" to "Competitive Prog",
    "DESIGN" to "Design",
    "WRITING" to "Writing",
    "EDU" to "Education",
    "COMM" to "Communication",
    "SOC" to "Social Media",
    "ENT" to "Entertainment",
    "UNCAT" to "Uncategorized"
)

private val CATEGORY_COLORS = mapOf(
    "DEV" to Color(0xFF4FC3F7),
    "CP" to Color(0xFF81C784),
    "DESIGN" to Color(0xFFBA68C8),
    "WRITING" to Color(0xFFFFB74D),
    "EDU" to Color(0xFF64B5F6),
    "COMM" to Color(0xFF4DB6AC),
    "SOC" to Color(0xFFE57373),
    "ENT" to Color(0xFFFF8A65),
    "UNCAT" to Color(0xFF90A4AE)
)

private val TIER_COLORS = mapOf(
    "DIAMOND" to Color(0xFFB9F2FF),
    "PLATINUM" to Color(0xFFE5E4E2),
    "GOLD" to Color(0xFFFFD700),
    "SILVER" to Color(0xFFC0C0C0),
    "BRONZE" to Color(0xFFCD7F32)
)

@Composable
fun DashboardScreen(
    onLogout: () -> Unit,
    onNavigateToLeaderboard: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Key all fetches to the logged-in userId so switching accounts always loads fresh data
    val userId = remember { TokenManager.getUserId(context) }

    var rating by remember { mutableStateOf<RatingResponse?>(null) }
    var score by remember { mutableStateOf<ScoreResponse?>(null) }
    var domainRankings by remember { mutableStateOf<DomainRankingsResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var isSending by remember { mutableStateOf(false) }

    // Initial fetch and periodic polling every 30 seconds
    LaunchedEffect(userId) {
        while (true) {
            withContext(Dispatchers.IO) {
                val r = MetricsApiClient.getRating(context)
                val s = MetricsApiClient.getScore(context)
                val d = MetricsApiClient.getDomainRankings(context)
                rating = r
                score = s
                domainRankings = d
            }
            isLoading = false
            // Wait 30 seconds before next refresh
            delay(30000)
        }
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
                    onClick = onLogout,
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, DarkDivider),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text("Log Out", color = OnDarkMuted, fontSize = 13.sp)
                }
            }

            // ── Scrollable content ───────────────────────────────────────────
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
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // ── 1. Rating & Tier Card ────────────────────────────────
                    RatingCard(rating)

                    // ── 2. Today's Score Card ────────────────────────────────
                    ScoreCard(score)

                    // ── 3. Live Activity (Updates every 30s) ──────────────────
                    if (score?.totals != null && score!!.totals!!.isNotEmpty()) {
                        LiveActivityCard(score!!)
                    }

                    // ── 4. Category Breakdown ────────────────────────────────
                    if (score?.totals != null && score!!.totals!!.isNotEmpty()) {
                        CategoryBreakdownCard(score!!)
                    }

                    // ── 5. Domain Rankings ───────────────────────────────────
                    if (domainRankings?.rankings != null && domainRankings!!.rankings!!.isNotEmpty()) {
                        DomainRankingsCard(domainRankings!!)
                    }

                    // ── 6. Actions ───────────────────────────────────────────
                    ActionsCard(
                        isSending = isSending,
                        onSendReport = {
                            isSending = true
                            scope.launch {
                                withContext(Dispatchers.IO) {
                                    val report = UsageStatsHelper.collectTodayUsage(context)
                                    UsageApiClient.sendReport(context, report)
                                }
                                // Refresh metrics after sending
                                withContext(Dispatchers.IO) {
                                    score = MetricsApiClient.getScore(context)
                                    domainRankings = MetricsApiClient.getDomainRankings(context)
                                }
                                isSending = false
                            }
                        },
                        onViewLeaderboard = onNavigateToLeaderboard
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD COMPOSABLES
// ═══════════════════════════════════════════════════════════════════════════════

@Composable
private fun RatingCard(rating: RatingResponse?) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkSurface, RoundedCornerShape(16.dp))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Your Rating", color = OnDarkMuted, fontSize = 13.sp, fontWeight = FontWeight.Medium)
        Spacer(modifier = Modifier.height(12.dp))

        if (rating != null) {
            // Big display rating
            Text(
                text = String.format("%.2f", rating.displayRating ?: 0.0),
                color = OnDark,
                fontSize = 48.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Tier badge
            val tier = rating.tier ?: "BRONZE"
            val tierColor = TIER_COLORS[tier] ?: TIER_COLORS["BRONZE"]!!
            Box(
                modifier = Modifier
                    .background(tierColor.copy(alpha = 0.15f), RoundedCornerShape(20.dp))
                    .padding(horizontal = 16.dp, vertical = 6.dp)
            ) {
                Text(
                    text = tier,
                    color = tierColor,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Stats row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(
                    label = "Streak",
                    value = "${rating.streak ?: 0} 🔥"
                )
                StatItem(label = "Persona", value = rating.personaRole ?: "—")
            }
        } else {
            Text("No rating data yet", color = OnDarkMuted, fontSize = 14.sp)
        }
    }
}

@Composable
private fun StatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = OnDark, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        Spacer(modifier = Modifier.height(2.dp))
        Text(label, color = OnDarkMuted, fontSize = 11.sp)
    }
}

@Composable
private fun ScoreCard(score: ScoreResponse?) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkSurface, RoundedCornerShape(16.dp))
            .padding(24.dp)
    ) {
        Text("Today's Score", color = OnDarkMuted, fontSize = 13.sp, fontWeight = FontWeight.Medium)
        Spacer(modifier = Modifier.height(12.dp))

        if (score != null && score.weightedScore != null) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = String.format("%.2f", score.weightedScore),
                        color = CyanBlue,
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Bold
                    )

                }

                // Streak status
                val streakMet = score.streakMet ?: false
                Box(
                    modifier = Modifier
                        .background(
                            if (streakMet) Color(0xFF1B5E20).copy(alpha = 0.3f)
                            else Color(0xFF4E342E).copy(alpha = 0.3f),
                            RoundedCornerShape(12.dp)
                        )
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = if (streakMet) "✓ Streak Met" else "✗ Streak Not Met",
                        color = if (streakMet) Color(0xFF81C784) else Color(0xFFE57373),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        } else {
            Text(
                "No activity recorded today. Use your apps and check back!",
                color = OnDarkMuted,
                fontSize = 14.sp
            )
        }
    }
}

@Composable
private fun LiveActivityCard(score: ScoreResponse) {
    val totals = score.totals ?: return
    val sorted = totals.entries.sortedByDescending { it.value }.take(3)

    if (sorted.isEmpty()) return

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkSurface, RoundedCornerShape(16.dp))
            .padding(24.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                "Top Categories (Live)",
                color = OnDarkMuted,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(YellowGreen, CircleShape)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        sorted.forEachIndexed { index, (category, minutes) ->
            val label = CATEGORY_LABELS[category] ?: category
            val color = CATEGORY_COLORS[category] ?: Color.Gray

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "${index + 1}",
                    color = CyanBlue,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.width(20.dp)
                )

                Text(
                    text = label,
                    color = OnDark,
                    fontSize = 13.sp,
                    modifier = Modifier.weight(1f)
                )

                Box(
                    modifier = Modifier
                        .background(color.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "${minutes.roundToInt()}m",
                        color = color,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Updates every 30 seconds",
            color = OnDarkMuted,
            fontSize = 11.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun CategoryBreakdownCard(score: ScoreResponse) {
    val totals = score.totals ?: return
    val sorted = totals.entries.sortedByDescending { it.value }
    val maxMinutes = sorted.firstOrNull()?.value ?: 1.0

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkSurface, RoundedCornerShape(16.dp))
            .padding(24.dp)
    ) {
        Text(
            "Category Breakdown",
            color = OnDarkMuted,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(16.dp))

        sorted.forEach { (category, minutes) ->
            val label = CATEGORY_LABELS[category] ?: category
            val color = CATEGORY_COLORS[category] ?: Color.Gray
            val fraction = (minutes / maxMinutes).coerceIn(0.0, 1.0).toFloat()

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = label,
                    color = OnDark,
                    fontSize = 12.sp,
                    modifier = Modifier.width(110.dp)
                )

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(14.dp)
                        .clip(RoundedCornerShape(7.dp))
                        .background(DarkDivider)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(fraction)
                            .clip(RoundedCornerShape(7.dp))
                            .background(color)
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                Text(
                    text = "${minutes.roundToInt()} min",
                    color = OnDarkMuted,
                    fontSize = 11.sp,
                    modifier = Modifier.width(52.dp),
                    textAlign = TextAlign.End
                )
            }
        }
    }
}

@Composable
private fun DomainRankingsCard(domainRankings: DomainRankingsResponse) {
    val rankings = domainRankings.rankings ?: return

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkSurface, RoundedCornerShape(16.dp))
            .padding(24.dp)
    ) {
        Text(
            "Your Percentile Rankings",
            color = OnDarkMuted,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(16.dp))

        rankings.entries.sortedByDescending { it.value.percentile }.forEach { (category, ranking) ->
            val label = CATEGORY_LABELS[category] ?: category
            val color = CATEGORY_COLORS[category] ?: Color.Gray
            val percentile = ranking.percentile
            val fraction = (percentile / 100.0).coerceIn(0.0, 1.0).toFloat()

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = label,
                    color = OnDark,
                    fontSize = 12.sp,
                    modifier = Modifier.width(110.dp)
                )

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(14.dp)
                        .clip(RoundedCornerShape(7.dp))
                        .background(DarkDivider)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(fraction)
                            .clip(RoundedCornerShape(7.dp))
                            .background(color)
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                Text(
                    text = "${String.format("%.0f", percentile)}%",
                    color = OnDarkMuted,
                    fontSize = 11.sp,
                    modifier = Modifier.width(42.dp),
                    textAlign = TextAlign.End
                )
            }

            // Rank detail: #2 of 15
            Text(
                text = "#${ranking.rank} of ${ranking.totalUsers}",
                color = OnDarkMuted.copy(alpha = 0.6f),
                fontSize = 10.sp,
                modifier = Modifier.padding(start = 110.dp, bottom = 4.dp)
            )
        }
    }
}

@Composable
private fun ActionsCard(
    isSending: Boolean,
    onSendReport: () -> Unit,
    onViewLeaderboard: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(DarkSurface, RoundedCornerShape(16.dp))
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Tracking active indicator
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(YellowGreen, CircleShape)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Tracking Active", color = YellowGreen, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }

        Button(
            onClick = onSendReport,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = CyanBlue, contentColor = Color.White),
            enabled = !isSending
        ) {
            if (isSending) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
            } else {
                Text("Send Report Now", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
            }
        }

        OutlinedButton(
            onClick = onViewLeaderboard,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(10.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, CyanBlue)
        ) {
            Text("View Leaderboard", color = CyanBlue, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
        }
    }
}
