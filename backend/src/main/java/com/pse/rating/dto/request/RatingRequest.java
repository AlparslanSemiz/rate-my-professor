package com.pse.rating.dto.request;

import java.util.List;
import java.util.UUID;

public record RatingRequest(
        UUID lectureId,
        List<RatingTopicRequest> topics
) {}