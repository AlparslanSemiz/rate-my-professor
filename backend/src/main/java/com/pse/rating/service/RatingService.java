package com.pse.rating.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.lecture.service.LectureService;
import com.pse.rating.dto.response.RatingCategoriesResponse;
import com.pse.rating.dto.response.RatingCategoryResponse;
import com.pse.rating.dto.response.RatingsAverageResponse;
import com.pse.rating.model.RatingCategory;
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

    private final StudentService studentService;
    private final AuthService authService;
    private final LectureService lectureService;


    private final RatingRepository ratingRepository;

    public RatingService(StudentService studentService, AuthService authService, LectureService lectureService, RatingRepository ratingRepository) {
        this.studentService = studentService;
        this.authService = authService;
        this.lectureService = lectureService;
        this.ratingRepository = ratingRepository;
    }



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

            topic.setCategory(topicRequest.category());
            topic.setValue((short) topicRequest.value());
            topic.setRating(rating);

            rating.getTopics().add(topic);
        }

        ratingRepository.save(rating);


        return new BasicResponse("Rating submitted successfully",true);

    }


    public RatingsAverageResponse getRatings(UUID lectureId) {

        List<Rating> ratings = ratingRepository.findByLectureId(lectureId);

        Map<RatingCategory, Double> sums = new HashMap<>();
        Map<RatingCategory, Double> counts = new HashMap<>();

        for (Rating rating : ratings) {

            for (RatingTopic topic : rating.getTopics()) {

                RatingCategory category = topic.getCategory();

                sums.put(category, sums.getOrDefault(category, 0.0) + topic.getValue());

                counts.put(category, counts.getOrDefault(category, 0.0) + 1);
            }
        }

        List<TopicAverageResponse> result = new ArrayList<>();

        for (RatingCategory category : sums.keySet()) {

            double average = (double) sums.get(category) / counts.get(category);
            
            result.add(new TopicAverageResponse(category, average));
        }

        return new RatingsAverageResponse("Success, found " + result.size() + " ratings", true, result);

    }


    public RatingCategoriesResponse getRatingCategories(UUID lectureId) {

        Lecture lecture = lectureService.findById(lectureId);

        List<RatingCategoryResponse> responses = new ArrayList<>();

        for (RatingCategory category : lecture.getLectureType().getDefaultCategories()) {

            responses.add(
                    new RatingCategoryResponse(
                            category,
                            category.getDisplayName(),
                            category.getDefaultWeight()
                    )
            );
        }

        return new RatingCategoriesResponse("Found " + responses.size() + " categories", true, responses);
    }
}