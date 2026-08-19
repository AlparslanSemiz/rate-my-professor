package com.pse.moderation.dto.response;

import java.util.List;

public record ManagedAnswersResponse(
        String message,
        boolean success,
        List<ManagedAnswerResponse> answers
) {
}
