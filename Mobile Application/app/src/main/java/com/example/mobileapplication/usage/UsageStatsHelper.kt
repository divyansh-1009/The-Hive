package com.example.mobileapplication.usage

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.provider.Settings
import com.example.mobileapplication.model.AppUsage
import com.example.mobileapplication.model.UsageReport
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

object UsageStatsHelper {

    fun hasUsagePermission(context: Context): Boolean {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 60_000, now)
        return stats != null && stats.isNotEmpty()
    }

    /**
     * Collect today's usage from midnight up to the current moment.
     * Used by the manual "Send Report Now" button.
     */
    fun collectTodayUsage(context: Context): UsageReport {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startTime = cal.timeInMillis          // today 00:00
        val endTime = System.currentTimeMillis()  // now
        val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)
        return collectUsageInRange(context, startTime, endTime, dateStr)
    }

    /**
     * Collect yesterday's usage using UsageEvents for accurate per-app foreground time.
     * Used by the nightly background worker.
     */
    fun collectDailyUsage(context: Context): UsageReport {
        // Yesterday midnight → today midnight
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val endTime = cal.timeInMillis          // today 00:00
        cal.add(Calendar.DAY_OF_YEAR, -1)
        val startTime = cal.timeInMillis         // yesterday 00:00
        val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)
        return collectUsageInRange(context, startTime, endTime, dateStr)
    }

    /**
     * Shared implementation: walk UsageEvents in [startTime, endTime] and build a UsageReport.
     */
    private fun collectUsageInRange(
        context: Context,
        startTime: Long,
        endTime: Long,
        dateStr: String
    ): UsageReport {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val pm = context.packageManager

        val foregroundStart = mutableMapOf<String, Long>()
        val totalDuration = mutableMapOf<String, Long>()

        val events = usm.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            when (event.eventType) {
                UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                    foregroundStart[event.packageName] = event.timeStamp
                }
                UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                    val start = foregroundStart.remove(event.packageName) ?: continue
                    val duration = event.timeStamp - start
                    totalDuration[event.packageName] =
                        (totalDuration[event.packageName] ?: 0L) + duration
                }
            }
        }

        // Any app still in foreground — cap at endTime
        for ((pkg, start) in foregroundStart) {
            val duration = endTime - start
            totalDuration[pkg] = (totalDuration[pkg] ?: 0L) + duration
        }

        val apps = totalDuration
            .filter { it.value > 0 }
            .map { (pkg, duration) ->
                val appName = try {
                    val info = pm.getApplicationInfo(pkg, 0)
                    pm.getApplicationLabel(info).toString()
                } catch (_: PackageManager.NameNotFoundException) {
                    pkg
                }
                AppUsage(appName = appName, durationMs = duration)
            }
            .sortedByDescending { it.durationMs }

        val deviceId = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: "unknown"

        return UsageReport(
            deviceId = deviceId,
            date = dateStr,
            apps = apps
        )
    }
}
