package com.example.myapplication_java.DomainModel;

import java.util.List;

public record Rating (
    String lectureId,
    List<RatingTopic> topics
) {}
