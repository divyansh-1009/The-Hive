package com.example.mobileapplication.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AppColorScheme = darkColorScheme(
    primary              = CyanBlue,
    onPrimary            = Color.White,
    primaryContainer     = Color(0xFF1A3D4D),
    onPrimaryContainer   = CyanBlueLight,
    secondary            = YellowGreen,
    onSecondary          = Color(0xFF1A1A00),
    secondaryContainer   = Color(0xFF2C2E00),
    onSecondaryContainer = YellowGreen,
    tertiary             = Color(0xFF6EC6DE),
    onTertiary           = Color(0xFF001F28),
    background           = DarkBackground,
    onBackground         = OnDark,
    surface              = DarkSurface,
    onSurface            = OnDark,
    surfaceVariant       = DarkNavbar,
    onSurfaceVariant     = OnDarkMuted,
    outline              = DarkDivider,
    outlineVariant       = Color(0xFF3A3A3A),
    error                = Color(0xFFCF6679),
    onError              = Color.White,
    scrim                = Color(0xFF000000),
    inverseSurface       = OnDark,
    inverseOnSurface     = DarkBackground,
    inversePrimary       = CyanBlue,
)

@Composable
fun MobileApplicationTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AppColorScheme,
        typography = Typography,
        content = content
    )
}
