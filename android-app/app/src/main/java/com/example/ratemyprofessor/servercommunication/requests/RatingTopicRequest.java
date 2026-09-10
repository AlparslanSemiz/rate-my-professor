package com.example.ratemyprofessor.servercommunication.requests;

import com.example.ratemyprofessor.domain.RatingCategory;

public record RatingTopicRequest (

    RatingCategory category,
    double value
) {}
