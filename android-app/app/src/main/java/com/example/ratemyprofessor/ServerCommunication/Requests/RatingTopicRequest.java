package com.example.ratemyprofessor.ServerCommunication.Requests;

import com.example.ratemyprofessor.DomainModel.RatingCategory;

public record RatingTopicRequest (

    RatingCategory category,
    double value
) {}
