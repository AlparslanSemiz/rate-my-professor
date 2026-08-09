package com.pse.social.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.pse.shared.enums.ContentStatus;

public record CommentResponse(

        UUID commentID,
        String content,
        ContentStatus status,
        String studentUsername,
        String profilePicture,
        UUID lectureID,
        LocalDateTime createdAt,
        int downVotes,
        int upVotes,

        List<AnswerResponse> answers

) {
}
