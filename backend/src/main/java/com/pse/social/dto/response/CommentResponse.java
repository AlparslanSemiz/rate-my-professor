package com.pse.social.dto.response;

import com.pse.shared.enums.ContentStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CommentResponse(


        String content,
        ContentStatus status,
        String studentUsername,
        UUID lectureID,
        LocalDateTime createdAt,

        List<AnswerResponse> answers

) {
}
