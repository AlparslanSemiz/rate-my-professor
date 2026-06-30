package com.pse.moderation.dto.response;

import java.util.List;

public record BugReportsResponse(
        String message,
        boolean success,
        List<BugReportResponse> bugReports
) {
}
