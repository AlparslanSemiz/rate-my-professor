package com.pse.moderation.dto.response;

import com.pse.shared.enums.ReportReason;
import com.pse.shared.enums.ReportStatus;

import java.util.UUID;

public record ReportedCommentResponse(

        UUID id,
        String commentContent,
        String postContext, //TODO: Unsure what this means
        String reportText,
        UserReferenceResponse reportedUser,
        UserReferenceResponse reporter,
        ReportReason reason,
        ReportStatus status,
        String date
) {
}
