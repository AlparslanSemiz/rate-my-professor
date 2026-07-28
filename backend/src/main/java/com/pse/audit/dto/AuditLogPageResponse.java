package com.pse.audit.dto;

import java.util.List;

public record AuditLogPageResponse(
        String message,
        boolean success,
        List<AuditLogResponse> auditLogs,
        String nextCursor
) {
}
