package com.example.ratemyprofessor.ServerCommunication.Responses;

import java.util.List;

public record RatingCategoriesResponse(
        String message,
        boolean success,
        List<RatingCategoryResponse> categories
) {}
