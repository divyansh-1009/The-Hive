package com.example.mobileapplication.model

data class AppUsage(
    val appName: String,
    val durationMs: Long
)

data class UsageReport(
    val deviceId: String,
    val date: String,
    val apps: List<AppUsage>
)
