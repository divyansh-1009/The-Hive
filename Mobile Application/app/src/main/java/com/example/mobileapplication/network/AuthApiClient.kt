package com.example.mobileapplication.network

import android.util.Log
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

data class AuthRequest(
    val email: String,
    val password: String,
    val name: String? = null
)

data class AuthResponse(
    val token: String?,
    val user: AuthUser?,
    val error: String?
)

data class AuthUser(
    val id: Int,
    val email: String,
    val name: String
)

object AuthApiClient {

    private const val TAG = "AuthApiClient"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    fun signup(email: String, password: String, name: String): AuthResponse? {
        return post(
            "${UsageApiClient.BASE_URL}/auth/signup",
            AuthRequest(email = email, password = password, name = name)
        )
    }

    fun login(email: String, password: String): AuthResponse? {
        return post(
            "${UsageApiClient.BASE_URL}/auth/login",
            AuthRequest(email = email, password = password)
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
