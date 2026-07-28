package com.pse.audit.dto;

import com.pse.audit.model.AuditAction;

import java.util.Map;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        AuditAction action,
        String createdAt,
        AuditActorResponse actor,
        AuditTargetResponse target,
        Map<String, Object> changes,
        Map<String, Object> metadata
) {
}
