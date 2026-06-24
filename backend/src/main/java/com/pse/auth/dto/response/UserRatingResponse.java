package com.pse.auth.dto.response;

import java.util.List;

public record UserRatingResponse(
        String message,
        boolean success,
        List<UserRatingDto> ratings
) {}
