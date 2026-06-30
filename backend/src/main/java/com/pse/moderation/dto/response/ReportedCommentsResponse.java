package com.pse.moderation.dto.response;

import java.util.List;

public record ReportedCommentsResponse(
        String message,
        boolean success,
        List<ReportedCommentResponse> comments
) {
}
