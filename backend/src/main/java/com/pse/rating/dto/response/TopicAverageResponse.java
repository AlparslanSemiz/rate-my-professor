package com.pse.rating.dto.response;


import com.pse.rating.model.RatingCategory;

public record TopicAverageResponse(
        RatingCategory category,
        double value
) {}