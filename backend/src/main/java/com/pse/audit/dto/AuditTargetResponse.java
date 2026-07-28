package com.pse.audit.dto;

import com.pse.audit.model.AuditTargetType;

import java.util.UUID;

public record AuditTargetResponse(
        AuditTargetType type,
        UUID id,
        String label
) {
}
