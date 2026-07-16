package com.example.myapplication_java.DomainModel;

public record LectureOffering (
    String offeringId,
    Lecture lecture,
    Professor professor,
    Semester semester
) {}
