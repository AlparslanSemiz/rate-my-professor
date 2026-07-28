package com.pse.moderation.dto.request;

import com.pse.shared.enums.BugSeverity;
import com.pse.shared.enums.ReportStatus;

public record BugReportUpdateRequest(
        ReportStatus status,
        BugSeverity severity
) {
}
