package com.example.ratemyprofessor.servercommunication.requests;

/**
 * Body of the login related requests.
 *
 * <p>The same body serves three routes: when requesting a token only the email is filled,
 * when logging in and when validating a saved login both values are set.</p>
 *
 * @param email      the KIT email address of the user
 * @param loginToken the one-time token the server sent to that address
 */
public record LoginRequest (
    String email,
    String loginToken
) {}
