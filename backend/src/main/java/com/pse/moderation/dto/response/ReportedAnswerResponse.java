package com.pse.moderation.dto.response;

import com.pse.shared.enums.ReportReason;
import com.pse.shared.enums.ReportStatus;

import java.util.UUID;

/**
 * A report against an answer. Mirrors {@link ReportedCommentResponse}, with the answer's
 * parent comment as the extra context the reported text sits in.
 */
public record ReportedAnswerResponse(

        UUID id,
        String answerContent,
        String commentContent,
        String postContext,
        String reportText,
        UserReferenceResponse reportedUser,
        UserReferenceResponse reporter,
        ReportReason reason,
        ReportStatus status,
        String date
) {
}
