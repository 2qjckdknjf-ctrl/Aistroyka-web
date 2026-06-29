plugins {
    // AGP 8.6.x supports compileSdk 35 (Play target API requirement) and requires JDK 17 + Gradle 8.7.
    id("com.android.application") version "8.6.1" apply false
    id("org.jetbrains.kotlin.android") version "1.9.20" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "1.9.20" apply false
    id("com.google.gms.google-services") version "4.4.2" apply false
}

subprojects {
    // Keep Java/Kotlin bytecode targets aligned across Android modules in CI.
    tasks.withType<org.gradle.api.tasks.compile.JavaCompile>().configureEach {
        sourceCompatibility = JavaVersion.VERSION_17.toString()
        targetCompatibility = JavaVersion.VERSION_17.toString()
    }
    tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
        kotlinOptions.jvmTarget = "17"
    }
}
