package com.pse.social.dto.request;

import com.pse.shared.enums.VoteType;


public record VoteCommentRequest(
        VoteType voteType
) {
}
