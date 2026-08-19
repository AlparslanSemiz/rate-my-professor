package com.pse.moderation.dto.response;

import com.pse.rating.model.RatingCategory;

public record ManagedRatingTopicResponse(
        RatingCategory category,
        double value
) {
}
