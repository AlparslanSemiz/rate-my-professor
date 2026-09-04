package com.example.ratemyprofessor.ServerCommunication.Responses;

import com.example.ratemyprofessor.DomainModel.RatingCategory;

public record RatingCategoryResponse(
        RatingCategory category,
        String displayName,
        double defaultWeight
) {}
