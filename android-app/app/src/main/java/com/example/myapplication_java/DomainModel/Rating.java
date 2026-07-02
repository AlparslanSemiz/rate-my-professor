package com.example.myapplication_java.DomainModel;

import java.util.List;

public class Rating {
    public String lectureId;
    List<RatingTopic> topics;
    public Rating(String lectureId, List<RatingTopic> topics) {
        this.lectureId = lectureId;
        this.topics = topics;
    }
}
