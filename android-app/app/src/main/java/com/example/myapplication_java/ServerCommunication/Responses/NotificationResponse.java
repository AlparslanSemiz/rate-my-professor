package com.example.myapplication_java.ServerCommunication.Responses;

import java.util.List;

public record NotificationResponse(
        String message,
        boolean success,
        List<NotificationDto> notifications
) {}