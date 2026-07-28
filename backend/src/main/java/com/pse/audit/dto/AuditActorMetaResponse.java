package com.pse.audit.dto;

import java.util.UUID;

public record AuditActorMetaResponse(
        UUID id,
        String name,
        String email,
        String role
) {
}
