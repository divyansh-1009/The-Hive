package com.example.mobileapplication.model

/**
 * Response from GET /api/score
 */
data class ScoreResponse(
    val totals: Map<String, Double>?,
    val logScaled: Map<String, Double>?,
    val weightedScore: Double?,
    val streakMet: Boolean?,
    val personaRole: String?
)

/**
 * Live global stats from WebSocket broadcast
 */
data class GlobalLiveStats(
    val totalActive: Int,
    val totalIdle: Int,
    val totalLocked: Int,
    val categoryBreakdown: Map<String, Int>?,
    val topSites: List<TopSite>?
)

data class TopSite(
    val site: String,
    val count: Int
)

/**
 * Live stats response (polling fallback)
 */
data class LiveStatsResponse(
    val type: String?,
    val timestamp: Long?,
    val global: GlobalLiveStats?
)

/**
 * Response from GET /api/rating
 */
data class RatingResponse(
    val mu: Double?,
    val sigma: Double?,
    val displayRating: Double?,
    val tier: String?,
    val streak: Int?,
    val personaRole: String?
)

/**
 * Single entry from GET /api/leaderboard
 */
data class LeaderboardEntry(
    val rank: Int,
    val name: String?,
    val displayRating: Double,
    val tier: String,
    val streak: Int
)

/**
 * Per-category ranking info from GET /api/ranking/domain
 */
data class DomainRanking(
    val percentile: Double,
    val rank: Int,
    val totalUsers: Int,
    val logScore: Double?
)

/**
 * Response from GET /api/ranking/domain
 */
data class DomainRankingsResponse(
    val date: String?,
    val message: String?,
    val rankings: Map<String, DomainRanking>?
)

/**
 * Category percentile info (within top categories from summary)
 */
data class PercentileInfo(
    val percentile: Double,
    val rank: Int,
    val totalUsers: Int,
    val persona: String?
)

/**
 * Top category entry from GET /api/summary/:date
 */
data class TopCategory(
    val category: String,
    val minutes: Double,
    val overall: PercentileInfo?,
    val withinPersona: PercentileInfo?
)

/**
 * Rating snapshot embedded in summary
 */
data class SummaryRating(
    val mu: Double?,
    val sigma: Double?,
    val displayRating: Double?,
    val tier: String?,
    val streak: Int?
)

/**
 * Response from GET /api/summary/:date
 */
data class SummaryResponse(
    val date: String?,
    val personaRole: String?,
    val topCategories: List<TopCategory>?,
    val rating: SummaryRating?,
    val message: String?
)
