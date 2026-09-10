import JSZip from 'jszip';

export interface ProjectFile {
  path: string;
  content: string;
}

export function getAndroidProjectFiles(): ProjectFile[] {
  return [
    {
      path: 'build.gradle.kts',
      content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`,
    },
    {
      path: 'settings.gradle.kts',
      content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "DSCWeb"
include(":app")
`,
    },
    {
      path: 'gradle/libs.versions.toml',
      content: `[versions]
agp = "8.8.0"
kotlin = "2.0.21"
coreKtx = "1.15.0"
junit = "4.13.2"
junitVersion = "1.2.1"
espressoCore = "3.6.1"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.10.0"
composeBom = "2025.02.00"
navigationCompose = "2.8.7"
retrofit = "2.11.0"
okhttp = "4.12.0"
coroutines = "1.10.1"
datastore = "1.1.2"
securityCrypto = "1.1.0-alpha06"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }
retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-converter-gson = { group = "com.squareup.retrofit2", name = "converter-gson", version.ref = "retrofit" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor", version.ref = "okhttp" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }
androidx-datastore-preferences = { group = "androidx.datastore", name = "datastore-preferences", version.ref = "datastore" }
androidx-security-crypto = { group = "androidx.security", name = "security-crypto", version.ref = "securityCrypto" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`,
    },
    {
      path: 'app/build.gradle.kts',
      content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.dsc.dscweb"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.dsc.dscweb"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
        buildConfigField("String", "BASE_URL", "\\"https://dscauth.onrender.com\\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // Networking
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.coroutines.android)

    // Secure Storage
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.security.crypto)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    debugImplementation(libs.androidx.ui.tooling)
}
`,
    },
    {
      path: 'app/src/main/AndroidManifest.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".DSCWebApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.DSCWeb"
        android:usesCleartextTraffic="false">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.DSCWeb">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`,
    },
    {
      path: 'app/src/main/res/values/strings.xml',
      content: `<resources>
    <string name="app_name">DSCWeb</string>
    <string name="corp_name">Dark Skull Corporation</string>
</resources>
`,
    },
    {
      path: 'app/src/main/res/values/colors.xml',
      content: `<resources>
    <color name="dsc_black">#08090D</color>
    <color name="dsc_surface">#151824</color>
    <color name="dsc_cyan">#06B6D4</color>
    <color name="dsc_purple">#8B5CF6</color>
    <color name="dsc_text">#F1F5F9</color>
</resources>
`,
    },
    {
      path: 'app/src/main/res/values/themes.xml',
      content: `<resources>
    <style name="Theme.DSCWeb" parent="android:Theme.Material.NoActionBar">
        <item name="android:statusBarColor">#08090D</item>
        <item name="android:navigationBarColor">#08090D</item>
    </style>
</resources>
`,
    },
    {
      path: 'app/src/main/java/com/dsc/dscweb/DSCWebApplication.kt',
      content: `package com.dsc.dscweb

import android.app.Application

class DSCWebApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize Keystore security & HTTP client
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/dsc/dscweb/core/network/RetrofitClient.kt',
      content: `package com.dsc.dscweb.core.network

import com.dsc.dscweb.BuildConfig
import com.dsc.dscweb.core.auth.TokenManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private const val BASE_URL = "https://dscauth.onrender.com"

    fun create(tokenManager: TokenManager): Retrofit {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY else HttpLoggingInterceptor.Level.NONE
        }

        val authInterceptor = Interceptor { chain ->
            val requestBuilder = chain.request().newBuilder()
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")

            tokenManager.getToken()?.let { token ->
                requestBuilder.addHeader("Authorization", "Bearer $token")
            }

            val response = chain.proceed(requestBuilder.build())
            if (response.code == 401) {
                tokenManager.clearSession()
            }
            response
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .addInterceptor(authInterceptor)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/dsc/dscweb/core/auth/TokenManager.kt',
      content: `package com.dsc.dscweb.core.auth

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONObject

class TokenManager(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "dsc_secure_auth_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveSession(token: String, username: String, role: String) {
        sharedPreferences.edit()
            .putString("KEY_TOKEN", token)
            .putString("KEY_USERNAME", username)
            .putString("KEY_ROLE", role)
            .apply()
    }

    fun getToken(): String? = sharedPreferences.getString("KEY_TOKEN", null)
    fun getUsername(): String? = sharedPreferences.getString("KEY_USERNAME", null)
    fun getRole(): String? = sharedPreferences.getString("KEY_ROLE", null)

    fun isTokenExpired(): Boolean {
        val token = getToken() ?: return true
        try {
            val parts = token.split(".")
            if (parts.size < 2) return true
            val payload = String(android.util.Base64.decode(parts[1], android.util.Base64.URL_SAFE))
            val json = JSONObject(payload)
            val exp = json.optLong("exp", 0)
            return exp > 0 && exp * 1000 < System.currentTimeMillis()
        } catch (e: Exception) {
            return true
        }
    }

    fun clearSession() {
        sharedPreferences.edit().clear().apply()
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/dsc/dscweb/data/remote/AuthApi.kt',
      content: `package com.dsc.dscweb.data.remote

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface AuthApi {
    @POST("/api/auth/login")
    suspend fun loginUser(@Body body: Map<String, String>): Response<Map<String, Any>>

    @POST("/api/admin/login")
    suspend fun loginAdmin(@Body body: Map<String, String>): Response<Map<String, Any>>

    @GET("/api/auth/my-order")
    suspend fun getMyOrder(): Response<Map<String, Any>>

    @GET("/api/auth/download")
    suspend fun downloadPlan(@Query("plan") plan: String): Response<Map<String, Any>>

    @POST("/api/auth/change-password")
    suspend fun changePassword(@Body body: Map<String, String>): Response<Map<String, Any>>

    @POST("/api/auth/checkout")
    suspend fun submitCheckout(@Body body: Map<String, Any>): Response<Map<String, Any>>

    @GET("/api/public/free-panel")
    suspend fun getFreePanel(): Response<Map<String, Any>>
}
`,
    },
    {
      path: 'app/src/main/java/com/dsc/dscweb/MainActivity.kt',
      content: `package com.dsc.dscweb

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DSCWebTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}

@Composable
fun DSCWebTheme(content: @Composable () -> Unit) {
    val darkColors = darkColorScheme(
        primary = Color(0xFF06B6D4),
        secondary = Color(0xFF8B5CF6),
        background = Color(0xFF08090D),
        surface = Color(0xFF151824),
        onPrimary = Color(0xFF083344),
        onBackground = Color(0xFFF1F5F9),
        onSurface = Color(0xFFF1F5F9)
    )

    MaterialTheme(
        colorScheme = darkColors,
        content = content
    )
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "home") {
        composable("home") { /* HomeScreen */ }
        composable("apps") { /* AppsScreen */ }
        composable("products") { /* ProductsScreen */ }
        composable("downloads") { /* DownloadsScreen */ }
        composable("freepanel") { /* FreePanelScreen */ }
        composable("user_login") { /* UserLoginScreen */ }
        composable("admin_login") { /* AdminLoginScreen */ }
        composable("user_dashboard") { /* UserDashboardScreen */ }
        composable("admin_dashboard") { /* AdminDashboardScreen */ }
        composable("owner_center") { /* OwnerCenterScreen */ }
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/dscweb/android/assistant/AIAssistantManager.kt',
      content: `package com.dscweb.android.assistant

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale

enum class AssistantVoiceState { IDLE, LISTENING, PROCESSING, SPEAKING, ERROR }

data class ActionDefinition(
    val code: String,
    val label: String,
    val minRole: String,
    val requiresOwner: Boolean = false,
    val requiresConfirmation: Boolean = false,
    val targetScreen: String? = null
)

data class ScreenSemantic(
    val screenId: String,
    val title: String,
    val description: String,
    val availableActions: List<String>
)

class AIAssistantManager(private val context: Context) : RecognitionListener, TextToSpeech.OnInitListener {
    private val _voiceState = MutableStateFlow(AssistantVoiceState.IDLE)
    val voiceState: StateFlow<AssistantVoiceState> = _voiceState.asStateFlow()

    private val _transcript = MutableStateFlow("")
    val transcript: StateFlow<String> = _transcript.asStateFlow()

    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    private var isTtsReady = false

    init {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(this@AIAssistantManager)
            }
        }
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.US
            isTtsReady = true
        }
    }

    fun startListening() {
        if (speechRecognizer == null) return
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
        }
        _voiceState.value = AssistantVoiceState.LISTENING
        speechRecognizer?.startListening(intent)
    }

    fun stopListening() {
        speechRecognizer?.stopListening()
        _voiceState.value = AssistantVoiceState.IDLE
    }

    fun speak(text: String) {
        if (!isTtsReady) return
        _voiceState.value = AssistantVoiceState.SPEAKING
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "DSC_ASSISTANT_TTS")
    }

    fun stopSpeaking() {
        tts?.stop()
        if (_voiceState.value == AssistantVoiceState.SPEAKING) {
            _voiceState.value = AssistantVoiceState.IDLE
        }
    }

    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val text = matches?.firstOrNull() ?: ""
        _transcript.value = text
        _voiceState.value = AssistantVoiceState.IDLE
    }

    override fun onError(error: Int) {
        _voiceState.value = AssistantVoiceState.ERROR
    }

    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}

    fun destroy() {
        speechRecognizer?.destroy()
        tts?.stop()
        tts?.shutdown()
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/dscweb/android/ui/components/AssistantBottomSheet.kt',
      content: `package com.dscweb.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.dscweb.android.assistant.AIAssistantManager
import com.dscweb.android.assistant.AssistantVoiceState

data class AssistantMessage(
    val sender: String,
    val text: String,
    val action: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssistantBottomSheet(
    assistantManager: AIAssistantManager,
    currentScreen: String,
    onNavigate: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val voiceState by assistantManager.voiceState.collectAsState()
    var inputText by remember { mutableStateOf("") }
    val messages = remember {
        mutableStateListOf(
            AssistantMessage("assistant", "Hello! I am your DSCWeb Voice Assistant. How can I help you navigate or inspect features today?")
        )
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF0E121E)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f)
                .padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "DSC AI Voice Assistant",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.Cyan
                )
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray)
                }
            }

            // Message Stream
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(messages) { msg ->
                    val isUser = msg.sender == "user"
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
                    ) {
                        Surface(
                            color = if (isUser) Color(0xFF00ADB5) else Color(0xFF1B2234),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.widthIn(max = 280.dp)
                        ) {
                            Text(
                                text = msg.text,
                                modifier = Modifier.padding(10.dp),
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            // Input Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FloatingActionButton(
                    onClick = {
                        if (voiceState == AssistantVoiceState.LISTENING) {
                            assistantManager.stopListening()
                        } else {
                            assistantManager.startListening()
                        }
                    },
                    containerColor = if (voiceState == AssistantVoiceState.LISTENING) Color.Red else Color.Cyan,
                    modifier = Modifier.size(44.dp)
                ) {
                    Icon(
                        imageVector = if (voiceState == AssistantVoiceState.LISTENING) Icons.Default.MicOff else Icons.Default.Mic,
                        contentDescription = "Microphone",
                        tint = Color.Black
                    )
                }

                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("Ask anything...", color = Color.Gray) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(20.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color.Cyan,
                        unfocusedBorderColor = Color.DarkGray
                    )
                )

                IconButton(
                    onClick = {
                        if (inputText.isNotBlank()) {
                            messages.add(AssistantMessage("user", inputText))
                            val q = inputText.lowercase()
                            inputText = ""
                            if (q.contains("download")) {
                                onNavigate("downloads")
                                messages.add(AssistantMessage("assistant", "Opening Download Center.", "OPEN_DOWNLOADS"))
                            } else if (q.contains("apps")) {
                                onNavigate("apps")
                                messages.add(AssistantMessage("assistant", "Opening Published Apps.", "OPEN_APPS"))
                            } else {
                                messages.add(AssistantMessage("assistant", "I am standing by to assist with DSCWeb Android actions."))
                            }
                        }
                    }
                ) {
                    Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.Cyan)
                }
            }
        }
    }
}
`,
    },
  ];
}

export async function createAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();
  const files = getAndroidProjectFiles();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  // Add build instructions README
  zip.file(
    'README.md',
    `# DSCWeb Native Android Project
Dark Skull Corporation (DSC) Official Native Android Application.

## Technology Stack
- Kotlin
- Jetpack Compose & Material 3
- Retrofit 2 + OkHttp 4
- AndroidX Security Crypto (EncryptedSharedPreferences / Android Keystore)
- Kotlin Coroutines & ViewModel
- Navigation Compose

## Build Instructions
1. Open Android Studio (Ladybug or newer).
2. Select **Open an Existing Project** and choose this extracted root directory.
3. Allow Gradle to sync dependencies.
4. Run on an Android 8.0+ (API 24+) emulator or physical device.
5. To assemble debug APK:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
   Output APK location:
   \`app/build/outputs/apk/debug/app-debug.apk\`
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
