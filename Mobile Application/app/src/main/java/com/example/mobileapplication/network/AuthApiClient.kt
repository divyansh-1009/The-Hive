package com.example.mobileapplication.network

import android.util.Log
import com.google.gson.Gson
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val deviceId: String,
    val deviceType: String = "mobile",
    val personaRole: String = "GENERAL"
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val userId: String?,
    val token: String?,
    val personaRole: String?,
    val error: String?
)

object AuthApiClient {

    private const val TAG = "AuthApiClient"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    fun register(name: String, email: String, password: String, deviceId: String, personaRole: String): AuthResponse? {
        return post(
            "${UsageApiClient.BASE_URL}/api/auth/register",
            RegisterRequest(name = name, email = email, password = password, deviceId = deviceId, personaRole = personaRole)
        )
    }

    fun login(email: String, password: String): AuthResponse? {
        return post(
            "${UsageApiClient.BASE_URL}/api/auth/login",
            LoginRequest(email = email, password = password)
        )
    }

    private fun post(url: String, body: Any): AuthResponse? {
        val json = gson.toJson(body)
        Log.d(TAG, "POST $url")

        val requestBody = json.toRequestBody("application/json; charset=utf-8".toMediaType())
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val responseBody = response.body?.string()
                Log.d(TAG, "Response ${response.code}: $responseBody")
                responseBody?.let { gson.fromJson(it, AuthResponse::class.java) }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Auth request failed", e)
            null
        }
    }
}
