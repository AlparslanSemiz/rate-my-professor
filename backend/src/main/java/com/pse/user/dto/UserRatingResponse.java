package com.pse.user.dto;

import java.util.List;

public record UserRatingResponse(
        String message,
        boolean success,
        List<UserRatingDto> ratings
) {}
