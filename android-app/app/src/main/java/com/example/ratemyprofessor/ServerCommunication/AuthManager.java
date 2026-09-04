package com.example.ratemyprofessor.ServerCommunication;

import com.example.ratemyprofessor.ServerCommunication.Responses.AuthState;

/**
 * This class holds the login state of the app to determine if the user is logged in or out so that
 * the app can know which functionalities to supply to the user.
 */
public class AuthManager {
    private static AuthManager instance;
    private AuthState authState = AuthState.LOGGED_OUT;

    private AuthManager() {}
    public static synchronized AuthManager getInstance() {
        if (instance == null) {
            instance = new AuthManager();
        }
        return instance;
    }

    public void setAuthState(AuthState authState) {
        this.authState = authState;
    }
    
    public boolean isLoggedIn() {
        return this.authState == AuthState.LOGGED_IN;
    }
}
