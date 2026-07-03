package com.pse.social.dto.response;

import java.util.List;

public record AnswersResponse(

        String message,
        boolean success,
        List<AnswerResponse> answers


) {
}
