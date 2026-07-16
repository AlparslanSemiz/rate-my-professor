package com.example.myapplication_java.DomainModel;

import java.util.Date;

public record Review (
    String reviewId,
    Date createdAt,
    Date updatedAt,
    double averageGrade,
    String text
) {}
