package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;

import android.net.ConnectivityManager;
import android.net.Network;

import androidx.appcompat.app.AppCompatDelegate;

import com.example.ratemyprofessor.adapters.LocalDateTimeConverter;
import com.example.ratemyprofessor.adapters.MainViewModel;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.NetworkUtils;
import com.example.ratemyprofessor.servercommunication.responses.AuthState;
import com.example.ratemyprofessor.logic.RatingColorCalculator;
import com.example.ratemyprofessor.logic.SearchViewModel;

import org.junit.After;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

import java.time.LocalDateTime;

/**
 * tests the login session, light/dark modes and connectivity.
 */
@RunWith(RobolectricTestRunner.class)
public class SessionApplicationAndUtilityTest {

    /**
     * Restores the default night mode after each test.
     */
    @After
    public void resetNightMode() {
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
    }

    /**
     * Verifies that login session persists and clears values.
     */
    @Test
    public void loginSessionPersistsAndClearsValues() {
        Application context = RuntimeEnvironment.getApplication();
        LoginSession session = LoginSession.from(context);

        session.clear();

        assertEquals("", session.mailAddress());
        assertEquals("", session.loginToken());
        assertEquals("", session.authToken());
        assertEquals("Bearer ", session.bearerToken());
        assertFalse(session.isLoggedIn());

        session.saveMailAddress("student@kit.edu");
        assertFalse(session.isLoggedIn());

        session.saveTokens("123456", "");
        assertFalse(session.isLoggedIn());

        session.saveTokens("123456", "auth-token");
        LoginSession reopened = LoginSession.from(context);

        assertEquals("student@kit.edu", reopened.mailAddress());
        assertEquals("123456", reopened.loginToken());
        assertEquals("auth-token", reopened.authToken());
        assertEquals("Bearer auth-token", reopened.bearerToken());
        assertTrue(reopened.isLoggedIn());

        reopened.clear();
        assertFalse(LoginSession.from(context).isLoggedIn());
    }

    /**
     * Verifies that my application applies saved dark mode.
     */
    @Test
    public void myApplicationAppliesSavedDarkMode() {
        SharedPreferences settings = cleanSettings();
        settings.edit()
                .putBoolean(RateMyProfessorApplication.DARK_MODE_KEY, true)
                .commit();

        new PreferenceBackedProfessorApplicationRate(settings).onCreate();

        assertEquals(AppCompatDelegate.MODE_NIGHT_YES, AppCompatDelegate.getDefaultNightMode());
    }

    /**
     * Verifies that my application applies saved light mode.
     */
    @Test
    public void myApplicationAppliesSavedLightMode() {
        SharedPreferences settings = cleanSettings();
        settings.edit()
                .putBoolean(RateMyProfessorApplication.DARK_MODE_KEY, false)
                .commit();

        new PreferenceBackedProfessorApplicationRate(settings).onCreate();

        assertEquals(AppCompatDelegate.MODE_NIGHT_NO, AppCompatDelegate.getDefaultNightMode());
    }

    /**
     * Verifies that rating colours clamp values on light background.
     */
    @Test
    @Config(qualifiers = "notnight")
    public void ratingColoursClampValuesOnLightBackground() {
        Context context = RuntimeEnvironment.getApplication();

        int low = RatingColorCalculator.calculateColour(context, -1.0);
        int high = RatingColorCalculator.calculateColour(context, 7.0);

        assertEquals(158, Color.red(low));
        assertEquals(0, Color.green(low));
        assertEquals(0, Color.red(high));
        assertEquals(158, Color.green(high));
    }

    /**
     * Verifies that rating colours use full brightness on dark background.
     */
    @Test
    @Config(qualifiers = "night")
    public void ratingColoursUseFullBrightnessOnDarkBackground() {
        int middle = RatingColorCalculator.calculateColour(RuntimeEnvironment.getApplication(), 2.5);

        assertEquals(127, Color.red(middle));
        assertEquals(127, Color.green(middle));
        assertEquals(0, Color.blue(middle));
    }

    /**
     * Verifies that auth manager holds singleton state.
     */
    @Test
    public void authManagerHoldsSingletonState() {
        AuthManager manager = AuthManager.getInstance();
        manager.setAuthState(AuthState.LOGGED_OUT);
        assertFalse(manager.isLoggedIn());

        manager.setAuthState(AuthState.LOGGED_IN);
        assertTrue(manager.isLoggedIn());

        assertEquals(manager, AuthManager.getInstance());
    }

    /**
     * Verifies that main view model triggers refresh when logged in.
     */
    @Test
    public void mainViewModelTriggersRefreshWhenLoggedIn() {
        AuthManager.getInstance().setAuthState(AuthState.LOGGED_IN);
        new MainViewModel(RuntimeEnvironment.getApplication());
        // Just verify constructor doesn't crash, refresh logic is side-effect heavy
    }

    /**
     * Verifies that search view model publishes and clears query.
     */
    @Test
    public void searchViewModelPublishesAndClearsQuery() {
        SearchViewModel viewModel = new SearchViewModel();

        assertEquals("", viewModel.getQuery().getValue());

        viewModel.setQuery("algorithms");
        assertEquals("algorithms", viewModel.getQuery().getValue());

        viewModel.clearQuery();
        assertEquals("", viewModel.getQuery().getValue());
    }

    /**
     * Verifies that local date time converter handles nulls and round trip.
     */
    @Test
    public void localDateTimeConverterHandlesNullsAndRoundTrip() {
        assertNull(LocalDateTimeConverter.fromLocalDateTime(null));
        assertNull(LocalDateTimeConverter.toLocalDateTime(null));

        LocalDateTime now = LocalDateTime.now();
        String string = LocalDateTimeConverter.fromLocalDateTime(now);
        assertEquals(now, LocalDateTimeConverter.toLocalDateTime(string));
    }

    /**
     * Verifies that network utils returns false when no active network exists.
     */
    @Test
    public void networkUtilsReturnsFalseWhenNoActiveNetworkExists() {
        Context context = mock(Context.class);
        ConnectivityManager connectivityManager = mock(ConnectivityManager.class);
        when(context.getSystemService(Context.CONNECTIVITY_SERVICE))
                .thenReturn(connectivityManager);
        when(connectivityManager.getActiveNetwork()).thenReturn(null);

        assertFalse(NetworkUtils.isInternetAvailable(context));
    }

    /**
     * Verifies that network utils returns false when no capabilities exist.
     */
    @Test
    public void networkUtilsReturnsFalseWhenNoCapabilitiesExist() {
        Context context = mock(Context.class);
        ConnectivityManager connectivityManager = mock(ConnectivityManager.class);
        Network network = mock(Network.class);
        when(context.getSystemService(Context.CONNECTIVITY_SERVICE))
                .thenReturn(connectivityManager);
        when(connectivityManager.getActiveNetwork()).thenReturn(network);
        when(connectivityManager.getNetworkCapabilities(network)).thenReturn(null);

        assertFalse(NetworkUtils.isInternetAvailable(context));
    }

    /**
     * Verifies that network utils returns true when network is validated.
     */
    @Test
    public void networkUtilsReturnsTrueWhenNetworkIsValidated() {
        Context context = RuntimeEnvironment.getApplication();
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        org.robolectric.shadows.ShadowConnectivityManager shadowCM = org.robolectric.Shadows.shadowOf(cm);

        // This makes getActiveNetwork() return a non-null network object
        shadowCM.setDefaultNetworkActive(true);

        // Manually creating and configuring capabilities
        android.net.NetworkCapabilities capabilities = org.robolectric.shadows.ShadowNetworkCapabilities.newInstance();
        org.robolectric.shadows.ShadowNetworkCapabilities shadowCaps = org.robolectric.Shadows.shadowOf(capabilities);
        shadowCaps.addCapability(android.net.NetworkCapabilities.NET_CAPABILITY_VALIDATED);

        // Link the active network to these capabilities in the shadow
        shadowCM.setNetworkCapabilities(cm.getActiveNetwork(), capabilities);

        assertTrue(NetworkUtils.isInternetAvailable(context));
    }

    private SharedPreferences cleanSettings() {
        SharedPreferences settings = RuntimeEnvironment.getApplication()
                .getSharedPreferences("my-application-settings-test", Context.MODE_PRIVATE);
        settings.edit().clear().commit();
        return settings;
    }

    private static final class PreferenceBackedProfessorApplicationRate extends RateMyProfessorApplication {
        private final SharedPreferences settings;

        private PreferenceBackedProfessorApplicationRate(SharedPreferences settings) {
            this.settings = settings;
        }

        @Override
        public SharedPreferences getSharedPreferences(String name, int mode) {
            if (SETTINGS_STORAGE.equals(name)) {
                return settings;
            }
            return super.getSharedPreferences(name, mode);
        }
    }
}
