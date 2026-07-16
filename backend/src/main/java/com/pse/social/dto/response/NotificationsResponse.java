package com.pse.social.dto.response;



import java.util.List;

public record NotificationsResponse(
        String message,
        boolean success,
        List<NotificationResponse> answers

) {
}
