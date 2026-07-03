package com.pse.social.dto.response;

import com.pse.shared.enums.ContentStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record AnswerResponse(
        UUID commentId,
        String content,
        ContentStatus status,
        String studentUsername,
        LocalDateTime createdAt
) {
}
