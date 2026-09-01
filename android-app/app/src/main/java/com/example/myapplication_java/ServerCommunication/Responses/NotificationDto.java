package com.example.myapplication_java.ServerCommunication.Responses;

import java.time.LocalDateTime;

/**
 * Notification Data Transfer Object class
 * @param type
 * @param userName
 * @param content
 * @param message
 * @param createdAt
 */
public record NotificationDto(
        String type,
        String userName,
        String content,
        String message,
        LocalDateTime createdAt
) {}