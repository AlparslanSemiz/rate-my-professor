package com.pse.moderation.dto.response;

import java.util.UUID;

public record WarningIssuerResponse(
        UUID id,
        Object student,
        String createdAt
) {
}
