package com.pse.social.dto.response;

import com.pse.shared.enums.ContentStatus;
import com.pse.shared.enums.VoteType;

import java.time.LocalDateTime;
import java.util.UUID;

public record AnswerResponse(
        UUID commentID,
        String content,
        ContentStatus status,
        String studentUsername,
        String profilePicture,
        LocalDateTime createdAt,
        int downVotes,
        int upVotes,
        VoteType userVote

) {
}
