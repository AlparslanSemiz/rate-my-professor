package com.pse.moderation.dto.response;

import com.pse.shared.enums.BugSeverity;
import com.pse.shared.enums.ReportStatus;


import java.time.LocalDateTime;
import java.util.UUID;

public record BugReportResponse(

        UUID id,
        String title,
        String description,
        BugSeverity severity,
        ReportStatus status,
        String reporterName,
        LocalDateTime reportedAt
) {
}
