package com.example.ratemyprofessor.servercommunication.responses;

import com.example.ratemyprofessor.domain.RatingCategory;

public record RatingCategoryResponse(
        RatingCategory category,
        String displayName,
        double defaultWeight
) {}
