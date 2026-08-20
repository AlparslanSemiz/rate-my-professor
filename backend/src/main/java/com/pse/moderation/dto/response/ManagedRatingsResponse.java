package com.pse.moderation.dto.response;

import java.util.List;

/**
 * @param nextCursor opaque cursor for the next page, or {@code null} on the last one. Only
 *                   non-null when the caller asked for a page by passing {@code limit}.
 */
public record ManagedRatingsResponse(
        String message,
        boolean success,
        List<ManagedRatingResponse> ratings,
        String nextCursor
) {
}
