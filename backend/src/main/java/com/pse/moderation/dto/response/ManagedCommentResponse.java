package com.pse.moderation.dto.response;

import com.pse.shared.enums.ContentStatus;

import java.util.UUID;

/**
 * A comment as the panel manages it — every comment, not only the reported ones.
 *
 * @param postContext the lecture it was posted under, formatted {@code "CODE — Name"}
 */
public record ManagedCommentResponse(
        UUID id,
        String content,
        ContentStatus status,
        UserReferenceResponse author,
        String postContext,
        UUID lectureId,
        int answers,
        int reports,
        String createdAt
) {
}
