package com.example.ratemyprofessor.servercommunication;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Single access point to the login data that is stored on the device.
 *
 * <p>'SharedPreferences' keeps this data persistently, even when the app is closed.
 * Wrapping it in one class means the storage name and the key names exist exactly once,
 * so a typo in a key can no longer silently return an empty value at runtime.</p>
 *
 * <p>Three values are kept: the email address the user logged in with, the one time
 * password (OTP) the server sent to that address, and the auth token the server
 * returned after a successful login.</p>
 */
public final class LoginSession {

    /**
     * Name of the SharedPreferences file that holds the login data.
     */
    private static final String STORAGE_NAME = "loginData";

    /**
     * Key for the email address the user logged in with.
     */
    private static final String KEY_MAIL_ADDRESS = "mailAddress";

    /**
     * Key for the one time password the server sent to the email address.
     */
    private static final String KEY_LOGIN_TOKEN = "OTP";

    /**
     * Key for the auth token the server returned after a successful login.
     */
    private static final String KEY_AUTH_TOKEN = "authToken";

    /**
     * Prefix the backend expects in the Authorization header.
     */
    private static final String BEARER_PREFIX = "Bearer ";

    private final SharedPreferences storage;

    private LoginSession(SharedPreferences storage) {
        this.storage = storage;
    }

    /**
     * Opens the login data storage for the given context.
     *
     * @param context any context, for example an activity or a fragment's context
     * @return the session backed by the shared login data storage
     */
    public static LoginSession from(Context context) {
        return new LoginSession(
                context.getSharedPreferences(STORAGE_NAME, Context.MODE_PRIVATE)
        );
    }

    /**
     * Returns the email address saved for the login session.
     *
     * @return the saved email address, or an empty string when nothing was saved yet
     */
    public String mailAddress() {
        return storage.getString(KEY_MAIL_ADDRESS, "");
    }

    /**
     * Returns the saved one-time password.
     *
     * @return the saved one time password, or an empty string when nothing was saved yet
     */
    public String loginToken() {
        return storage.getString(KEY_LOGIN_TOKEN, "");
    }

    /**
     * Returns the saved authentication token.
     *
     * @return the saved auth token, or an empty string when nothing was saved yet
     */
    public String authToken() {
        return storage.getString(KEY_AUTH_TOKEN, "");
    }

    /**
     * Builds the value for the Authorization header of an authenticated request.
     *
     * @return the auth token prefixed with "Bearer "
     */
    public String bearerToken() {
        return BEARER_PREFIX + authToken();
    }

    /**
     * A previous login only counts as complete when all credentials required for authenticated
     * requests are available locally. The server still validates the bearer token on every
     * authenticated request; this check merely lets the app open without a separate startup
     * request.
     *
     * @return true when a previous login can be validated against the server
     */
    public boolean isLoggedIn() {
        return !mailAddress().isEmpty()
                && !loginToken().isEmpty()
                && !authToken().isEmpty();
    }

    /**
     * Saves the email address the login token was requested for.
     *
     * @param mailAddress the address the user entered on the login screen
     */
    public void saveMailAddress(String mailAddress) {
        storage.edit()
                .putString(KEY_MAIL_ADDRESS, mailAddress)
                .apply();
    }

    /**
     * Saves both tokens of a successful login so the next app start can skip the login screen.
     *
     * @param loginToken the one time password the user entered
     * @param authToken  the auth token the server returned
     */
    public void saveTokens(String loginToken, String authToken) {
        storage.edit()
                .putString(KEY_LOGIN_TOKEN, loginToken)
                .putString(KEY_AUTH_TOKEN, authToken)
                .apply();
    }

    /**
     * Removes all saved login data, for example after the account was deleted.
     */
    public void clear() {
        storage.edit()
                .remove(KEY_MAIL_ADDRESS)
                .remove(KEY_LOGIN_TOKEN)
                .remove(KEY_AUTH_TOKEN)
                .apply();
    }
}
