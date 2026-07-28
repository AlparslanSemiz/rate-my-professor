package com.pse.moderation.dto.request;

import java.util.UUID;

public record WarningRequest (
    UUID userID,
    String message,
    AdminReferenceRequest createdFrom
) {
    public record AdminReferenceRequest(UUID id) {
    }
}
