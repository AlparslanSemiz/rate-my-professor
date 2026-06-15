package com.example.myapplication_java.DomainModel;

public class LectureOffering {
    public String offeringId;
    public Lecture lecture;
    public Professor professor;
    public Semester semester;
    public LectureOffering(String offeringId, Lecture lecture, Professor professor, Semester semester) {
        this.offeringId = offeringId;
        this.lecture = lecture;
        this.professor = professor;
        this.semester = semester;
    }

    //TODO: Implement here
    public double getAverageRating() {
        return 5;
    }
}
