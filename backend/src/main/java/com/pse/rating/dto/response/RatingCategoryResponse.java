package com.pse.rating.dto.response;

import com.pse.rating.model.RatingCategory;

public record RatingCategoryResponse(

        RatingCategory category,
        String displayName,
        double defaultWeight

) {
}
