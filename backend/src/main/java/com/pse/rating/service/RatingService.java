package com.pse.rating.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.lecture.service.LectureService;
import com.pse.user.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pse.lecture.model.Lecture;
import com.pse.rating.model.Rating;
import com.pse.rating.model.RatingTopic;
import com.pse.user.model.Student;
import com.pse.rating.repository.RatingRepository;
import com.pse.rating.dto.request.RatingRequest;
import com.pse.rating.dto.request.RatingTopicRequest;
import com.pse.rating.dto.response.TopicAverageResponse;

@Service
public class RatingService {

    @Autowired
    private StudentService studentService;
    @Autowired
    private AuthService authService;
    @Autowired
    private LectureService lectureService;


    @Autowired
    private RatingRepository ratingRepository;

    
    public BasicResponse submitRating(String authHeader, RatingRequest request) {

        Student student = authService.verifyUser(authHeader);

        if(student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }

        Lecture lecture = lectureService.findById(request.lectureId());

        if (lecture == null) {
            return new BasicResponse("Error, cannot find lecture with id " + request.lectureId() + "", false);
        }


        student = studentService.findByKitEmail(student.getKitEmail());

        if (student == null) {
            return new BasicResponse("Error, cannot find student", false);
        }

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


        return new BasicResponse("Rating submitted successfully",true);

    }


    public List<TopicAverageResponse> getRatings(UUID lectureId) {

        List<Rating> ratings = ratingRepository.findByLectureId(lectureId);

        Map<String, Integer> sums = new HashMap<>();
        Map<String, Integer> counts = new HashMap<>();

        for (Rating rating : ratings) {

            for (RatingTopic topic : rating.getTopics()) {

                String name = topic.getName();

                sums.put(name, sums.getOrDefault(name, 0) + topic.getValue());

                counts.put(name, counts.getOrDefault(name, 0) + 1);
            }
        }

        List<TopicAverageResponse> result = new ArrayList<>();

        for (String name : sums.keySet()) {

            double average = (double) sums.get(name) / counts.get(name);
            
            result.add(new TopicAverageResponse(name, average));
        }

        return result;
    }





}