package com.example.ratemyprofessor.ServerCommunication.Responses;

import java.util.List;

public record NotificationsResponse(
        String message,
        boolean success,
        List<NotificationResponse> notifications
) {}