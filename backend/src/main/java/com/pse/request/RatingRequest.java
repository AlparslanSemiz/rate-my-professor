package com.pse.request;

import java.util.List;
import java.util.UUID;

public record RatingRequest(
        UUID lectureId,
        List<RatingTopicRequest> topics
) {}