plugins {
    alias(libs.plugins.android.application)
    jacoco
}

android {
    namespace = "com.example.myapplication_java"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.example.myapplication_java"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        debug {
            // Skips the login screen and opens the app directly, so the rest of the app can be
            // worked on while the backend is unavailable. Set this to false to test the real
            // login flow. It is hardwired to false for release below, so it cannot ship.
            buildConfigField("boolean", "SKIP_LOGIN", "false")
        }
        release {
            buildConfigField("boolean", "SKIP_LOGIN", "false")
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.activity.ktx)
    implementation(libs.appcompat)
    implementation(libs.constraintlayout)
    implementation(libs.core.i18n)
    implementation(libs.material)
    implementation(libs.recyclerview)
    implementation(libs.viewpager2)
    testImplementation(libs.junit)
    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(libs.ext.junit)
    implementation(libs.retrofit)
    implementation(libs.converter.gson)
    implementation(libs.logging.interceptor)
    implementation(libs.room.runtime)
    implementation(libs.glide)
    annotationProcessor(libs.room.compiler)
    testImplementation(libs.mockwebserver)
}

jacoco {
    toolVersion = "0.8.14"
}

tasks.register<JacocoReport>("debugUnitTestCoverage") {
    dependsOn("testDebugUnitTest")

    reports {
        xml.required.set(true)
        csv.required.set(true)
        html.required.set(true)
    }

    val excludes = listOf(
        "**/R.class",
        "**/R$*.class",
        "**/BuildConfig.*",
        "**/*Binding.*",
        "**/*_Impl.*",
        "**/*_Impl*",
        "**/Activities/**",
        "**/Adapters/**",
        "**/Fragments/**"
    )

    classDirectories.setFrom(
        files(
            fileTree(layout.buildDirectory.dir("intermediates/javac/debug/compileDebugJavaWithJavac/classes")) {
                exclude(excludes)
            },
            fileTree(layout.buildDirectory.dir("tmp/kotlin-classes/debug")) {
                exclude(excludes)
            }
        )
    )
    sourceDirectories.setFrom(files("src/main/java"))
    executionData.setFrom(fileTree(layout.buildDirectory) {
        include("jacoco/testDebugUnitTest.exec")
    })
}
