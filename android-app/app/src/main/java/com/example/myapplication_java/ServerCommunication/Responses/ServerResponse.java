package com.example.myapplication_java.ServerCommunication.Responses;

/**
 * Answer of the login related routes.
 *
 * @param message   a human readable explanation, mostly relevant when the login failed
 * @param success   whether the login step was accepted
 * @param authToken the token used to authorize later requests; only set after a successful login
 */
public record ServerResponse (
    String message,
    boolean success,
    String authToken
) {}
