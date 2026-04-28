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

fun configuredValue(name: String, default: String): String {
    val env = System.getenv(name)?.takeIf { it.isNotBlank() }
    val gradleProp = providers.gradleProperty(name).orNull?.takeIf { it.isNotBlank() }
    val local = localProps.getProperty(name)?.takeIf { it.isNotBlank() }
    return env ?: gradleProp ?: local ?: default
}

android {
    namespace = "ai.aistroyka.worker"
    compileSdk = 34
    defaultConfig {
        applicationId = "ai.aistroyka.worker"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        buildConfigField("String", "BASE_URL", "\"${configuredValue("BASE_URL", "https://www.aistroyka.ai")}\"")
        buildConfigField("String", "SUPABASE_URL", "\"${configuredValue("SUPABASE_URL", "")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${configuredValue("SUPABASE_ANON_KEY", "")}\"")
        buildConfigField(
            "boolean",
            "PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO",
            configuredValue("PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO", "false")
        )
    }
    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.5" }
    packagingOptions { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions { jvmTarget = "11" }
}
dependencies {
    implementation(project(":shared"))
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.activity:activity-compose:1.8.1")
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.material3:material3")
}
