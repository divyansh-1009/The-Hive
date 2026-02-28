package com.example.mobileapplication.network

import android.content.Context
import android.util.Log
import com.example.mobileapplication.model.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * API client for fetching user metrics: score, rating, leaderboard, domain rankings, summary.
 */
object MetricsApiClient {

    private const val TAG = "MetricsApiClient"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    // ── GET /api/score ────────────────────────────────────────────────────────
    fun getScore(context: Context): ScoreResponse? {
        return authenticatedGet(context, "${UsageApiClient.BASE_URL}/api/score")
    }

    // ── GET /api/rating ───────────────────────────────────────────────────────
    fun getRating(context: Context): RatingResponse? {
        return authenticatedGet(context, "${UsageApiClient.BASE_URL}/api/rating")
    }

    // ── GET /api/leaderboard ──────────────────────────────────────────────────
    fun getLeaderboard(context: Context): List<LeaderboardEntry>? {
        val url = "${UsageApiClient.BASE_URL}/api/leaderboard"
        Log.d(TAG, "GET $url")

        val request = Request.Builder().url(url).get().build()

        return try {
            client.newCall(request).execute().use { response ->
                val body = response.body?.string()
                Log.d(TAG, "Leaderboard ${response.code}: $body")
                if (response.isSuccessful && body != null) {
                    val type = object : TypeToken<List<LeaderboardEntry>>() {}.type
                    gson.fromJson(body, type)
                } else null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Leaderboard fetch failed", e)
            null
        }
    }

    // ── GET /api/ranking/domain ───────────────────────────────────────────────
    fun getDomainRankings(context: Context): DomainRankingsResponse? {
        return authenticatedGet(context, "${UsageApiClient.BASE_URL}/api/ranking/domain")
    }

    // ── GET /api/summary/:date ────────────────────────────────────────────────
    fun getSummary(context: Context, date: String): SummaryResponse? {
        return authenticatedGet(context, "${UsageApiClient.BASE_URL}/api/summary/$date")
    }

    // ── Generic authenticated GET ─────────────────────────────────────────────
    private inline fun <reified T> authenticatedGet(context: Context, url: String): T? {
        val token = TokenManager.getToken(context) ?: run {
            Log.w(TAG, "No auth token")
            return null
        }
        Log.d(TAG, "GET $url")

        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val body = response.body?.string()
                Log.d(TAG, "Response ${response.code}: $body")
                if (response.isSuccessful && body != null) {
                    gson.fromJson(body, T::class.java)
                } else null
            }
        } catch (e: Exception) {
            Log.e(TAG, "GET $url failed", e)
            null
        }
    }
}
