package com.pse.social.dto.response;

import java.util.List;

public record CommentsResponse(
        String message,
        boolean success,
        List<CommentResponse> comments
) {
}
