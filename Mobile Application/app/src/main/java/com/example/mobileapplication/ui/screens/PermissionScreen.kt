package com.example.mobileapplication.ui.screens

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.mobileapplication.ui.theme.CyanBlue
import com.example.mobileapplication.ui.theme.DarkBackground
import com.example.mobileapplication.ui.theme.DarkDivider
import com.example.mobileapplication.ui.theme.DarkNavbar
import com.example.mobileapplication.ui.theme.DarkSurface
import com.example.mobileapplication.ui.theme.OnDark
import com.example.mobileapplication.ui.theme.OnDarkMuted
import com.example.mobileapplication.ui.theme.YellowGreen

@Composable
fun PermissionScreen(
    onPermissionGranted: () -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        // Header bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(DarkNavbar)
                .padding(vertical = 20.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = buildAnnotatedString {
                    withStyle(SpanStyle(color = OnDark, fontWeight = FontWeight.Bold, fontSize = 22.sp)) {
                        append("THE ")
                    }
                    withStyle(SpanStyle(color = YellowGreen, fontWeight = FontWeight.Bold, fontSize = 22.sp)) {
                        append("HIVE")
                    }
                }
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 80.dp, start = 24.dp, end = 24.dp, bottom = 40.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Icon circle
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .background(DarkSurface, CircleShape)
                    .border(2.dp, CyanBlue, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "📊", fontSize = 36.sp)
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "Usage Access Required",
                color = OnDark,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(14.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DarkSurface, RoundedCornerShape(12.dp))
                    .padding(20.dp)
            ) {
                Text(
                    text = "To track your app usage, this app needs permission to access usage statistics.",
                    color = OnDarkMuted,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(DarkDivider)
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Find this app in the list and enable access, then return here.",
                    color = OnDarkMuted,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = { context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = CyanBlue, contentColor = Color.White)
            ) {
                Text("Grant Usage Access", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedButton(
                onClick = onLogout,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(10.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkDivider)
            ) {
                Text("Log Out", color = OnDarkMuted, fontSize = 16.sp)
            }
        }
    }
}
