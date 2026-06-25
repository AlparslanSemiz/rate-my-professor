package com.pse.social.dto.request;

public record CommentSubmitRequest(
        String lectureID,
        String content
) {}
