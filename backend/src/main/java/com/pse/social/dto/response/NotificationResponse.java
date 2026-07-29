package com.pse.social.dto.response;


import com.pse.shared.enums.NotificationType;

import java.time.LocalDateTime;


/**
 * One notification in the student's feed.
 *
 * <p>{@code type} is the discriminator. For {@code ANSWER} the answer author is in
 * {@code userName} and their text in {@code content}, and {@code message} is null.
 * For {@code WARNING} the reason is in {@code message}, and {@code userName} and
 * {@code content} are null — a warning is not attributed to a person publicly and
 * carries no answer.
 */
public record NotificationResponse(
        NotificationType type,
        String userName,
        String content,
        String message,
        LocalDateTime createdAt
) {
}
