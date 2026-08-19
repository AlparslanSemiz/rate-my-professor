package com.pse.moderation.dto.response;

import java.util.UUID;

public record WarningResponse(
        UUID id,
        UUID userID,
        String message,
        String createdAt,
        WarningIssuerResponse createdFrom
) {
}
