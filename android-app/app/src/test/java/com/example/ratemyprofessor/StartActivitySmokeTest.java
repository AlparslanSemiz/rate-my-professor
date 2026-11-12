package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.junit.Assert.assertTrue;

import android.content.Intent;

import com.example.ratemyprofessor.activities.LoginActivity;
import com.example.ratemyprofessor.activities.MainActivity;
import android.app.Application;

import com.example.ratemyprofessor.activities.StartActivity;
import com.example.ratemyprofessor.servercommunication.NetworkUtils;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.responses.AuthState;

import org.junit.After;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.MockedStatic;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.Shadows;
import org.robolectric.shadows.ShadowActivity;

/**
 * Verifies the startup routing logic (devMode, offline handling, login checks).
 */
@RunWith(RobolectricTestRunner.class)
public class StartActivitySmokeTest {

    /**
     * Clears saved login credentials before each test.
     */
    @After
    public void clearSession() {
        LoginSession.from(RuntimeEnvironment.getApplication()).clear();
        AuthManager.getInstance().setAuthState(AuthState.LOGGED_OUT);
    }

    /**
     * Verifies that development mode opens the main activity.
     */
    @Test
    public void startsMainActivityWhenDevModeIsTrue() {
        Intent intent = new Intent(RuntimeEnvironment.getApplication(), StartActivity.class);
        intent.putExtra("devMode", true);

        StartActivity activity = Robolectric.buildActivity(StartActivity.class, intent).setup().get();
        ShadowActivity shadowActivity = Shadows.shadowOf(activity);

        Intent startedIntent = shadowActivity.getNextStartedActivity();
        assertNotNull("Activity should have started another intent", startedIntent);
        assertEquals(MainActivity.class.getName(), startedIntent.getComponent().getClassName());
    }

    /**
     * Verifies that offline startup opens the main activity.
     */
    @Test
    public void startsMainActivityWhenOffline() {
        try (MockedStatic<NetworkUtils> networkMock = mockStatic(NetworkUtils.class)) {
            networkMock.when(() -> NetworkUtils.isInternetAvailable(any())).thenReturn(false);

            StartActivity activity = Robolectric.buildActivity(StartActivity.class).setup().get();
            ShadowActivity shadowActivity = Shadows.shadowOf(activity);

            Intent startedIntent = shadowActivity.getNextStartedActivity();
            assertNotNull("Activity should have started another intent", startedIntent);
            assertEquals(MainActivity.class.getName(), startedIntent.getComponent().getClassName());
        }
    }

    /**
     * Verifies that startup opens the login activity when no session exists.
     */
    @Test
    public void startsLoginActivityWhenNotLoggedIn() {
        // Assuming clean session (Robolectric clear storage by default)
        try (MockedStatic<NetworkUtils> networkMock = mockStatic(NetworkUtils.class)) {
            networkMock.when(() -> NetworkUtils.isInternetAvailable(any())).thenReturn(true);

            StartActivity activity = Robolectric.buildActivity(StartActivity.class).setup().get();
            ShadowActivity shadowActivity = Shadows.shadowOf(activity);

            Intent startedIntent = shadowActivity.getNextStartedActivity();
            assertNotNull("Activity should have started another intent", startedIntent);
            assertEquals(LoginActivity.class.getName(), startedIntent.getComponent().getClassName());
        }
    }

    /**
     * Verifies that saved session opens main screen immediately.
     */
    @Test
    public void savedSessionOpensMainScreenImmediately() {
        Application context = RuntimeEnvironment.getApplication();
        LoginSession session = LoginSession.from(context);
        session.clear();
        session.saveMailAddress("student@kit.edu");
        session.saveTokens("123456", "auth-token");

        StartActivity activity = Robolectric
                .buildActivity(StartActivity.class)
                .setup()
                .get();

        Intent nextActivity = Shadows.shadowOf(activity).getNextStartedActivity();
        assertNotNull(nextActivity);
        assertEquals(MainActivity.class.getName(), nextActivity.getComponent().getClassName());
        assertTrue(AuthManager.getInstance().isLoggedIn());

    }
}
