import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val localProps = Properties().apply {
    val localPropsFile = rootProject.file("local.properties")
    if (localPropsFile.exists()) {
        localPropsFile.inputStream().use(::load)
    }
}

// Release signing is loaded from android/keystore.properties when present.
// keystore.properties and the keystore itself are gitignored and must never be committed.
val keystoreProperties = Properties().apply {
    val keystorePropertiesFile = rootProject.file("keystore.properties")
    if (keystorePropertiesFile.exists()) {
        keystorePropertiesFile.inputStream().use(::load)
    }
}
val releaseStoreFile = keystoreProperties.getProperty("storeFile")?.let { rootProject.file(it) }
val hasReleaseSigning = releaseStoreFile?.exists() == true &&
    !keystoreProperties.getProperty("storePassword").isNullOrBlank() &&
    !keystoreProperties.getProperty("keyAlias").isNullOrBlank() &&
    !keystoreProperties.getProperty("keyPassword").isNullOrBlank()

fun configuredValue(name: String, default: String): String {
    val env = System.getenv(name)?.takeIf { it.isNotBlank() }
    val gradleProp = providers.gradleProperty(name).orNull?.takeIf { it.isNotBlank() }
    val local = localProps.getProperty(name)?.takeIf { it.isNotBlank() }
    return env ?: gradleProp ?: local ?: default
}

// Store/CI builds may override versionCode without editing source; local builds default to 1.
val resolvedVersionCode =
    (providers.gradleProperty("AISTROYKA_ANDROID_VERSION_CODE").orNull
        ?: providers.environmentVariable("AISTROYKA_ANDROID_VERSION_CODE").orNull)
        ?.trim()?.toIntOrNull() ?: 1

android {
    namespace = "ai.aistroyka.manager"
    compileSdk = 35
    defaultConfig {
        applicationId = "ai.aistroyka.manager"
        minSdk = 26
        targetSdk = 35
        versionCode = resolvedVersionCode
        versionName = "1.0.0"
        buildConfigField("String", "BASE_URL", "\"${configuredValue("BASE_URL", "https://www.aistroyka.ai")}\"")
        buildConfigField("String", "SUPABASE_URL", "\"${configuredValue("SUPABASE_URL", "")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${configuredValue("SUPABASE_ANON_KEY", "")}\"")
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = releaseStoreFile
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }
    buildTypes {
        getByName("release") {
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
    buildFeatures {
        buildConfig = true
        compose = true
    }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.5" }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    implementation(project(":shared"))
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")
    implementation("androidx.activity:activity-compose:1.8.1")
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.material3:material3")
    implementation("com.google.android.material:material:1.12.0")
    implementation("io.coil-kt:coil-compose:2.5.0")
    // Instrumented launch smoke (ManagerAppLaunchInstrumentedTest) — mirrors Worker.
    androidTestImplementation(platform("androidx.compose:compose-bom:2023.10.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test:runner:1.5.2")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
