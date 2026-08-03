package com.example.myapplication_java.ServerCommunication.Requests;

import com.example.myapplication_java.DomainModel.RatingCategory;

public record RatingTopicRequest (

    RatingCategory category,
    double value
) {}
