package com.example.ratemyprofessor;

import android.app.Application;
import android.content.SharedPreferences;

import androidx.appcompat.app.AppCompatDelegate;

/**
 * Applies app-wide configuration before any activity starts,
 * currently the dark mode choice saved in the settings screen.
 */
public class RateMyProfessorApplication extends Application {

    /**
     * SharedPreferences file that stores the settings screen choices.
     */
    public static final String SETTINGS_STORAGE = "settings";

    /**
     * SharedPreferences file that stores the personal statistics.
     */
    public static final String STATISTICS_STORAGE = "statistics";
    /**
     * Key for the saved dark mode choice.
     */
    public static final String DARK_MODE_KEY = "darkMode";

    /**
     * Restores the saved dark mode choice when the app process starts.
     */
    @Override
    public void onCreate() {
        super.onCreate();

        SharedPreferences settingsStorage = getSharedPreferences(SETTINGS_STORAGE, MODE_PRIVATE);
        int nightMode = settingsStorage.getBoolean(DARK_MODE_KEY, true)
                ? AppCompatDelegate.MODE_NIGHT_YES
                : AppCompatDelegate.MODE_NIGHT_NO;
        AppCompatDelegate.setDefaultNightMode(nightMode);
    }
}
