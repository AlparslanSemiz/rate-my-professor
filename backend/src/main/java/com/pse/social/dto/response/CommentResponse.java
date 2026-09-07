package com.pse.social.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.pse.shared.enums.ContentStatus;
import com.pse.shared.enums.VoteType;

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
        VoteType userVote,

        List<AnswerResponse> answers

) {
}
