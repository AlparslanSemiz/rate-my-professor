package com.pse.moderation.dto.response;

import java.util.List;

public record ReportedAnswersResponse(
        String message,
        boolean success,
        List<ReportedAnswerResponse> answers
) {
}
