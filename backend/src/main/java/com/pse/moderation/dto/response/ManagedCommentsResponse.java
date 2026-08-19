package com.pse.moderation.dto.response;

import java.util.List;

public record ManagedCommentsResponse(
        String message,
        boolean success,
        List<ManagedCommentResponse> comments
) {
}
