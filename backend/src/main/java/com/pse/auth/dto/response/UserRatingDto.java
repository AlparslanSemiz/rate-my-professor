package com.pse.auth.dto.response;


import com.pse.lecture.dto.response.LectureResponse;

//Used for "List of my Ratings
public record UserRatingDto(

        LectureResponse lecture,
        double overallRating

) {}