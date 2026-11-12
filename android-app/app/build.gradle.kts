plugins {
    alias(libs.plugins.android.application)
    jacoco
}

android {
    namespace = "com.example.ratemyprofessor"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.example.ratemyprofessor"
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
            buildConfigField("boolean", "SKIP_LOGIN", "true")
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

    testOptions {
        unitTests {
            isIncludeAndroidResources = true
            isReturnDefaultValues = true

            // Für Robolectric unter JDK 17 oder neuer
            all {
                it.extensions.configure(org.gradle.testing.jacoco.plugins.JacocoTaskExtension::class.java) {
                    isIncludeNoLocationClasses = true
                    excludes = listOf("jdk.internal.*")
                }
                it.jvmArgs(
                    "--add-opens=java.base/java.lang=ALL-UNNAMED",
                    "--add-opens=java.base/java.util=ALL-UNNAMED",
                    "--add-opens=java.base/java.io=ALL-UNNAMED",
                    "--add-opens=java.base/java.net=ALL-UNNAMED",
                    "--add-opens=java.base/java.security=ALL-UNNAMED",
                    "--add-opens=java.base/java.text=ALL-UNNAMED",
                    "--add-opens=java.base/jdk.internal.access=ALL-UNNAMED",
                    "--add-opens=java.desktop/java.awt.font=ALL-UNNAMED",
                    "--add-opens=jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED",
                )
            }
        }
    }
}

dependencies {
    implementation(libs.activity.ktx)
    implementation(libs.appcompat)
    implementation(libs.constraintlayout)
    implementation(libs.core)
    implementation(libs.core.i18n)
    implementation(libs.material)
    implementation(libs.recyclerview)
    implementation(libs.viewpager2)
    testImplementation(libs.junit)
    testImplementation(libs.mockwebserver)
    testImplementation(libs.robolectric)
    testImplementation("org.mockito:mockito-core:5.12.0")
    testImplementation("org.mockito:mockito-inline:5.2.0")
    testImplementation("androidx.test:core:1.6.1")
    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(libs.ext.junit)
    implementation(libs.retrofit)
    implementation(libs.converter.gson)
    implementation(libs.logging.interceptor)
    implementation(libs.room.runtime)
    implementation(libs.glide)
    annotationProcessor(libs.room.compiler)
    implementation("com.github.QWEA0:liquidglass:v2.0.4")
}

jacoco {
    toolVersion = "0.8.14"
}

val debugCoverageExcludes = listOf(
    "**/R.class",
    "**/R$*.class",
    "**/BuildConfig.*",
    "**/*Binding.*",
    "**/*_Impl.*",
    "**/*_Impl*",
)

fun debugCoverageClassDirectories() = files(
    fileTree(layout.buildDirectory.dir("intermediates/javac/debug/compileDebugJavaWithJavac/classes")) {
        exclude(debugCoverageExcludes)
    },
    fileTree(layout.buildDirectory.dir("tmp/kotlin-classes/debug")) {
        exclude(debugCoverageExcludes)
    }
)

tasks.register<JacocoReport>("debugUnitTestCoverage") {
    dependsOn("testDebugUnitTest")
    finalizedBy("debugUnitTestCoverageVerification")

    reports {
        xml.required.set(true)
        csv.required.set(true)
        html.required.set(true)
    }

    classDirectories.setFrom(debugCoverageClassDirectories())
    sourceDirectories.setFrom(files("src/main/java"))
    executionData.setFrom(fileTree(layout.buildDirectory) {
        include("jacoco/testDebugUnitTest.exec")
    })
}

tasks.register<org.gradle.testing.jacoco.tasks.JacocoCoverageVerification>(
    "debugUnitTestCoverageVerification"
) {
    dependsOn("testDebugUnitTest")

    classDirectories.setFrom(debugCoverageClassDirectories())
    sourceDirectories.setFrom(files("src/main/java"))
    executionData.setFrom(fileTree(layout.buildDirectory) {
        include("jacoco/testDebugUnitTest.exec")
    })

    violationRules {
        rule {
            limit {
                counter = "INSTRUCTION"
                value = "COVEREDRATIO"
                minimum = "0.90".toBigDecimal()
            }
        }
    }
}
