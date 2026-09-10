package com.example.ratemyprofessor.servercommunication.responses;

import java.util.List;

/**
 * Contains the result of retrieving notifications for the current user.
 *
 * @param message the message returned by the server
 * @param success whether the server operation succeeded
 * @param notifications the notifications to display
 */
public record NotificationsResponse(
        String message,
        boolean success,
        List<NotificationResponse> notifications
) {}