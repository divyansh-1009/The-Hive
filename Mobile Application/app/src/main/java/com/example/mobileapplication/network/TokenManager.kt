package com.example.mobileapplication.network

import android.content.Context
import android.content.SharedPreferences

object TokenManager {

    private const val PREFS_NAME = "auth_prefs"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_USER_ID = "user_id"

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun saveToken(context: Context, token: String) {
        prefs(context).edit().putString(KEY_TOKEN, token).apply()
    }

    fun getToken(context: Context): String? =
        prefs(context).getString(KEY_TOKEN, null)

    fun saveUserId(context: Context, userId: String) {
        prefs(context).edit().putString(KEY_USER_ID, userId).apply()
    }

    fun getUserId(context: Context): String? =
        prefs(context).getString(KEY_USER_ID, null)

    /** Clears both token and userId — call this on logout. */
    fun clearAll(context: Context) {
        prefs(context).edit().remove(KEY_TOKEN).remove(KEY_USER_ID).apply()
    }

    @Deprecated("Use clearAll() to also remove userId", ReplaceWith("clearAll(context)"))
    fun clearToken(context: Context) = clearAll(context)
}
