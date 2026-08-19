package com.pse.moderation.dto.request;

import com.pse.shared.enums.BugSeverity;
import com.pse.shared.enums.ReportStatus;

/**
 * Partial update of a bug report. An omitted (null) field is left alone; at least one has
 * to be supplied. {@code title} and {@code description} are editable so a report filed
 * with a useless title can be made findable.
 */
public record BugReportUpdateRequest(
        ReportStatus status,
        BugSeverity severity,
        String title,
        String description
) {
}
