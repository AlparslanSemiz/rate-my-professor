package com.example.ratemyprofessor.activities;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.NetworkUtils;
import com.example.ratemyprofessor.servercommunication.responses.AuthState;

/**
 * This Activity is the entry point of the program. We check whether the user is already logged in,
 * and then forward the program towards either Login- or MainActivity accordingly.
 *
 * <p>A saved login is accepted locally so the main screen can be shown immediately. The first
 * authenticated request still validates the token with the server and returns to the login screen
 * if the token has expired.</p>
 */
public class StartActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // This jumps the login screen when we launch the app with a "devMode" parameter
        boolean isDevMode = getIntent().getBooleanExtra("devMode", false);
        if (isDevMode) {
            openScreen(MainActivity.class);
            return;
        }

        LoginSession session = LoginSession.from(this);

        if (!session.isLoggedIn()) {
            AuthManager.getInstance().setAuthState(AuthState.LOGGED_OUT);
            openScreen(NetworkUtils.isInternetAvailable(this)
                    ? LoginActivity.class
                    : MainActivity.class);
            return;
        }

        AuthManager.getInstance().setAuthState(AuthState.LOGGED_IN);
        openScreen(MainActivity.class);
    }

    /**
     * Opens the given screen and closes this one.
     *
     * @param screen the activity to continue with
     */
    private void openScreen(Class<?> screen) {
        startActivity(new Intent(this, screen));
        finish(); // StartActivity can be closed, as it will be not accessed again
    }
}
