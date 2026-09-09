package com.pse.social.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AnswerSubmitRequest(
        @NotBlank String commentID,
        @NotBlank String content
) {
}
