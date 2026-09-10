package com.example.ratemyprofessor.servercommunication;

import com.example.ratemyprofessor.servercommunication.responses.AuthState;

/**
 * This class holds the login state of the app to determine if the user is logged in or out so that
 * the app can know which functionalities to supply to the user.
 */
public class AuthManager {
    private static AuthManager instance;
    private AuthState authState = AuthState.LOGGED_OUT;

    private AuthManager() {}
    /**
     * Returns the shared authentication manager, creating it on first access.
     *
     * @return the shared authentication manager
     */
    public static synchronized AuthManager getInstance() {
        if (instance == null) {
            instance = new AuthManager();
        }
        return instance;
    }

    /**
     * Updates the authentication state held by this manager.
     *
     * @param authState the new authentication state
     */
    public void setAuthState(AuthState authState) {
        this.authState = authState;
    }
    
    /**
     * Checks whether the stored authentication state is logged in.
     *
     * @return true if the state is LOGGED_IN; false otherwise
     */
    public boolean isLoggedIn() {
        return this.authState == AuthState.LOGGED_IN;
    }
}
