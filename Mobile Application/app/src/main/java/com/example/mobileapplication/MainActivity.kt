package com.example.mobileapplication

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import com.example.mobileapplication.network.TokenManager
import com.example.mobileapplication.ui.screens.HomeScreen
import com.example.mobileapplication.ui.screens.LoginScreen
import com.example.mobileapplication.ui.screens.PermissionScreen
import com.example.mobileapplication.ui.screens.SignUpScreen
import com.example.mobileapplication.ui.theme.MobileApplicationTheme
import com.example.mobileapplication.usage.UsageStatsHelper
import com.example.mobileapplication.worker.UsageTrackingWorker

/**
 * Screens in the app's navigation flow.
 */
enum class Screen {
    LOGIN, SIGNUP, PERMISSION, HOME
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MobileApplicationTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    AppNavigation(modifier = Modifier.padding(innerPadding))
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (UsageStatsHelper.hasUsagePermission(this)) {
            UsageTrackingWorker.schedule(this)
        }
    }
}

/**
 * Root composable that handles navigation between auth, permission, and home screens.
 *
 * Flow:
 *  1. If no JWT token saved → Login (with option to go to SignUp)
 *  2. If token exists but no usage permission → Permission request screen
 *  3. If token exists and permission granted → Home screen
 */
@Composable
fun AppNavigation(modifier: Modifier = Modifier) {
    val context = LocalContext.current

    // Determine the initial screen based on current state
    val initialScreen = remember {
        when {
            TokenManager.getToken(context) == null -> Screen.LOGIN
            !UsageStatsHelper.hasUsagePermission(context) -> Screen.PERMISSION
            else -> Screen.HOME
        }
    }

    var currentScreen by remember { mutableStateOf(initialScreen) }

    // Re-check permission every time the activity resumes (e.g. after returning
    // from the system Settings screen) so we auto-advance past the permission screen.
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        if (currentScreen == Screen.PERMISSION && UsageStatsHelper.hasUsagePermission(context)) {
            UsageTrackingWorker.schedule(context)
            currentScreen = Screen.HOME
        }
    }

    when (currentScreen) {
        Screen.LOGIN -> LoginScreen(
            onLoginSuccess = {
                currentScreen = if (UsageStatsHelper.hasUsagePermission(context)) {
                    UsageTrackingWorker.schedule(context)
                    Screen.HOME
                } else {
                    Screen.PERMISSION
                }
            },
            onNavigateToSignUp = { currentScreen = Screen.SIGNUP }
        )

        Screen.SIGNUP -> SignUpScreen(
            onSignUpSuccess = {
                currentScreen = if (UsageStatsHelper.hasUsagePermission(context)) {
                    UsageTrackingWorker.schedule(context)
                    Screen.HOME
                } else {
                    Screen.PERMISSION
                }
            },
            onNavigateToLogin = { currentScreen = Screen.LOGIN }
        )

        Screen.PERMISSION -> PermissionScreen(
            onPermissionGranted = {
                UsageTrackingWorker.schedule(context)
                currentScreen = Screen.HOME
            },
            onLogout = {
                TokenManager.clearToken(context)
                currentScreen = Screen.LOGIN
            }
        )

        Screen.HOME -> HomeScreen(
            onLogout = {
                TokenManager.clearToken(context)
                currentScreen = Screen.LOGIN
            }
        )
    }
}