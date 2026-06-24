package com.pse.auth.dto.response;

public record UserRatingDto(
        String lectureName,
        String professorName,
        String semester,
        int overallRating
) {}