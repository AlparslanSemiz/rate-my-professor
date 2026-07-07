package com.pse.moderation.dto.request;

import com.pse.shared.enums.BugSeverity;

public record BugReportRequest(

        String title,
        String description,
        BugSeverity severity
) {
}
