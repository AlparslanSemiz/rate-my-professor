package com.pse.rating.dto.response;

import java.util.List;

public record RatingCategoriesResponse(

        String message,
        boolean success,
        List<RatingCategoryResponse> categories

) {
}
