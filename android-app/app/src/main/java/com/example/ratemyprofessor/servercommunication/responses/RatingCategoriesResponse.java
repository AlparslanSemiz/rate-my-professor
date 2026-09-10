package com.example.ratemyprofessor.servercommunication.responses;

import java.util.List;

public record RatingCategoriesResponse(
        String message,
        boolean success,
        List<RatingCategoryResponse> categories
) {}
