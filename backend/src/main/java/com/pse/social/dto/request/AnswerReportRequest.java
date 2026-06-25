package com.pse.social.dto.request;

import com.pse.shared.enums.ReportReason;

public record AnswerReportRequest (
        String answerID,
        ReportReason reportReason,
        String explanation
){}