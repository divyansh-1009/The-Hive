package com.example.mobileapplication.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.example.mobileapplication.network.UsageApiClient
import com.example.mobileapplication.usage.UsageStatsHelper
import java.util.Calendar
import java.util.concurrent.TimeUnit

class UsageTrackingWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    companion object {
        private const val TAG = "UsageTrackingWorker"
        private const val WORK_NAME = "daily_usage_report"

        fun schedule(context: Context) {
            // Calculate delay until next midnight
            val now = Calendar.getInstance()
            val midnight = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, 1)
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val delayMs = midnight.timeInMillis - now.timeInMillis

            val request = PeriodicWorkRequestBuilder<UsageTrackingWorker>(
                24, TimeUnit.HOURS
            )
                .setInitialDelay(delayMs, TimeUnit.MILLISECONDS)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
            Log.i(TAG, "Daily usage report scheduled (first run in ${delayMs / 1000}s)")
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }

    override suspend fun doWork(): Result {
        Log.i(TAG, "Daily usage report worker started")

        return try {
            val report = UsageStatsHelper.collectDailyUsage(applicationContext)

            if (report.apps.isEmpty()) {
                Log.i(TAG, "No usage data for yesterday")
                return Result.success()
            }

            val sent = UsageApiClient.sendReport(report)
            if (sent) {
                Log.i(TAG, "Report for ${report.date} sent (${report.apps.size} apps)")
                Result.success()
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Worker failed", e)
            Result.retry()
        }
    }
}
