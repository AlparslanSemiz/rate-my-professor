package com.pse.audit.dto;

import java.util.List;

/**
 * A page of the activity log. Same entry shape and same cursor contract as
 * {@link AuditLogPageResponse}; the array is named after this endpoint.
 */
public record ActivityLogPageResponse(
        String message,
        boolean success,
        List<AuditLogResponse> activityLogs,
        String nextCursor
) {
}
