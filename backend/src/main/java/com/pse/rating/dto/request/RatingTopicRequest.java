package com.pse.rating.dto.request;

import com.pse.rating.model.RatingCategory;

public record RatingTopicRequest(
        RatingCategory category,
        double value
) {}