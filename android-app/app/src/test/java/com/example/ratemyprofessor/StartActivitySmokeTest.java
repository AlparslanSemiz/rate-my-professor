package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.app.Application;
import android.content.Intent;

import com.example.ratemyprofessor.Activities.MainActivity;
import com.example.ratemyprofessor.Activities.StartActivity;
import com.example.ratemyprofessor.ServerCommunication.AuthManager;
import com.example.ratemyprofessor.ServerCommunication.LoginSession;
import com.example.ratemyprofessor.ServerCommunication.Responses.AuthState;

import org.junit.After;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.Shadows;

/**
 * This test case checks whether the app crashes on start up.
 */
@RunWith(RobolectricTestRunner.class)
public class StartActivitySmokeTest {

    @After
    public void clearSession() {
        LoginSession.from(RuntimeEnvironment.getApplication()).clear();
        AuthManager.getInstance().setAuthState(AuthState.LOGGED_OUT);
    }

    @Test
    public void appStartsWithoutCrashing() {
        StartActivity activity = Robolectric
                .buildActivity(StartActivity.class)
                .setup()
                .get();

        assertNotNull(activity);
    }

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
