package com.example.mobileapplication.network

import android.util.Log
import com.example.mobileapplication.model.UsageReport
import com.google.gson.Gson
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

object UsageApiClient {

    private const val TAG = "UsageApiClient"

    // Change this to your actual server URL
    var SERVER_URL = "https://webhook.site/e055f727-e8c2-433d-b917-a25767a96632"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    fun sendReport(report: UsageReport): Boolean {
        val json = gson.toJson(report)
        Log.d(TAG, "Sending report: $json")

        val body = json.toRequestBody("application/json; charset=utf-8".toMediaType())
        val request = Request.Builder()
            .url(SERVER_URL)
            .post(body)
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                Log.i(TAG, "Server responded: ${response.code}")
                response.isSuccessful
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send report", e)
            false
        }
    }
}
