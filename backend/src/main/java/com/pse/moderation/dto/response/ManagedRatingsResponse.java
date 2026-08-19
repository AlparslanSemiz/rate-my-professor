package com.pse.moderation.dto.response;

import java.util.List;

public record ManagedRatingsResponse(
        String message,
        boolean success,
        List<ManagedRatingResponse> ratings
) {
}
