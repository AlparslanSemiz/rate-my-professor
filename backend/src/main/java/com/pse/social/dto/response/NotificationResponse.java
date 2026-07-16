package com.pse.social.dto.response;


import java.time.LocalDateTime;


public record NotificationResponse(
        String userName,
        String content,
        LocalDateTime createdAt
) {
}
