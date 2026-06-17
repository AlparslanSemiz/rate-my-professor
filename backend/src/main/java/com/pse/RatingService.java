package com.pse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pse.model.Lecture;
import com.pse.model.Rating;
import com.pse.model.RatingTopic;
import com.pse.model.Student;
import com.pse.repositories.LectureRepository;
import com.pse.repositories.RatingRepository;
import com.pse.repositories.StudentRepository;
import com.pse.request.RatingRequest;
import com.pse.request.RatingTopicRequest;

@Service
public class RatingService {
    @Autowired
    private RatingRepository ratingRepository;
    @Autowired
    private LectureRepository lectureRepository;
    @Autowired
    private StudentRepository studentRepository;

    
    public void submitRating(String studentEmail, RatingRequest request) {

         Lecture lecture = lectureRepository
                .findById(request.lectureId())
                .orElseThrow(() -> new IllegalArgumentException("Lecture not found"));


        Student student = studentRepository
                .findByKitEmail(studentEmail)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        Rating rating = new Rating();
        rating.setLecture(lecture);
        rating.setStudent(student);

        for (RatingTopicRequest topicRequest : request.topics()) {

            RatingTopic topic = new RatingTopic();

            topic.setName(topicRequest.name());
            topic.setValue((short) topicRequest.value());
            topic.setRating(rating);

            rating.getTopics().add(topic);
        }

        ratingRepository.save(rating);
    }
}