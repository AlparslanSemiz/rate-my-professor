package com.pse.audit.dto;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;

import java.util.List;

public record AuditMetaResponse(
        String message,
        boolean success,
        List<AuditActorMetaResponse> actors,
        List<AuditAction> actions,
        List<AuditTargetType> targetTypes
) {
}
