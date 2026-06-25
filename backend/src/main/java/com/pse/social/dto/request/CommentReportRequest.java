package com.pse.social.dto.request;

import com.pse.shared.enums.ReportReason;

public record CommentReportRequest(
        String commentID,
        ReportReason reportReason,
        String explanation
) {
}
