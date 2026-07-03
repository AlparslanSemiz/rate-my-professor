package com.pse.rating.dto.response;

import java.util.List;

public record RatingsAverageResponse(
        String message,
        boolean success,
        List<TopicAverageResponse> ratings
) {
}
