package com.pse.auth.dto.response;

public record UserRatingDto(
        String lectureName,
        String semester,
        int overallRating
) {}