package com.pse.moderation.dto.response;

import com.pse.shared.enums.ReportReason;
import com.pse.shared.enums.ReportStatus;

import java.util.UUID;

/**
 * A report against an answer. Mirrors {@link ReportedCommentResponse}, with the answer's
 * parent comment as the extra context the reported text sits in.
 *
 * @param id the <em>report's</em> id — what the status and withdrawal routes address
 * @param answerId the reported answer's own id, for acting on the content itself
 * @param commentId the parent comment's id, for opening the thread the answer sits in
 */
public record ReportedAnswerResponse(

        UUID id,
        UUID answerId,
        UUID commentId,
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
