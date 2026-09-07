package com.pse.audit.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record AuditLogPageResponse(
        String message,
        boolean success,
        List<AuditLogResponse> auditLogs,
        @Schema(nullable = true) String nextCursor
) {
}
