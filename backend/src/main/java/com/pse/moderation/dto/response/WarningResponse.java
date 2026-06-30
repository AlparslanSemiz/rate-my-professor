package com.pse.moderation.dto.response;

import com.pse.moderation.model.Admin;

import java.time.LocalDateTime;
import java.util.UUID;

public record WarningResponse(
        UUID userID,
        String message,
        LocalDateTime createdAt,
        Admin createdFrom
) {
}
