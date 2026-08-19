package com.pse.audit.dto;

import java.util.UUID;

public record AuditActorResponse(
        String type,
        UUID id,
        String name,
        String email,
        String role
) {
}
