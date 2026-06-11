package com.pse.response;

public record ProfessorResponse(
        String id,
        String firstName,
        String lastName,
        String photoUrl,
        double averageRating,
        int ratingCount
) {}