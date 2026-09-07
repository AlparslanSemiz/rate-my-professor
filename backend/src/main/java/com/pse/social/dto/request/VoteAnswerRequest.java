package com.pse.social.dto.request;

import com.pse.shared.enums.VoteType;
import jakarta.validation.constraints.NotNull;

public record VoteAnswerRequest(
        @NotNull VoteType voteType
) {
}
