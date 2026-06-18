package com.pse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
import com.pse.response.TopicAverageResponse;

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