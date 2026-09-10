package com.example.ratemyprofessor.servercommunication.responses;

import java.util.List;

public record NotificationsResponse(
        String message,
        boolean success,
        List<NotificationResponse> notifications
) {}