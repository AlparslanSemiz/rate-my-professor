package com.example.ratemyprofessor.servercommunication.responses;

/**
 * Answer of a route that only reports whether an action worked.
 *
 * <p>Note that {@code success} is separate from the HTTP status: a request can arrive at the
 * server (HTTP 200) and still be rejected by it, in which case {@code success} is false and
 * {@code message} explains why.</p>
 *
 * @param message a human-readable explanation, mostly relevant when the action failed
 * @param success whether the action was carried out
 */
public record BasicResponse (
        String message,
        boolean success
) {}
