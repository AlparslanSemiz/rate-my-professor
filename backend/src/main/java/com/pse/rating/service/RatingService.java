package com.pse.rating.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
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
import org.springframework.transaction.annotation.Transactional;

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
    private final AuditWriter auditWriter;

    public RatingService(StudentService studentService, AuthService authService, LectureService lectureService, RatingRepository ratingRepository, AuditWriter auditWriter) {
        this.studentService = studentService;
        this.authService = authService;
        this.lectureService = lectureService;
        this.ratingRepository = ratingRepository;
        this.auditWriter = auditWriter;
    }


    // Needs a transaction so that the rating and its activity-log entry commit together.
    @Transactional
    public BasicResponse submitRating(String authHeader, RatingRequest request) {

        Student student = authService.verifyUser(authHeader);

        if(student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }

        Lecture lecture = lectureService.findById(request.lectureId());

        if (lecture == null) {
            return new BasicResponse("Error, cannot find lecture with id " + request.lectureId(), false);
        }


        student = studentService.findByKitEmail(student.getKitEmail());

        if (student == null) {
            return new BasicResponse("Error, cannot find student", false);
        }

        //Check if User already has Rating
        Rating rating = ratingRepository.findByStudentIdAndLectureId(student.getId(), request.lectureId()).orElse(null);

        if (rating == null) {
            rating = new Rating();
            rating.setLecture(lecture);
            rating.setStudent(student);

        } else {
            //Overwrite existing rating topics
            rating.getTopics().clear();
            ratingRepository.flush();
        }


        double weightedSum = 0.0;
        double totalWeight = 0.0;


        for (RatingTopicRequest topicRequest : request.topics()) {

            // OVERALL shouldnt be set by client
            if (topicRequest.category() == RatingCategory.OVERALL) {
                continue;
            }

            RatingTopic topic = new RatingTopic();

            topic.setCategory(topicRequest.category());
            topic.setValue((short) topicRequest.value());
            topic.setRating(rating);

            rating.getTopics().add(topic);

            //for overall Rating
            double weight = topicRequest.category().getDefaultWeight();

            weightedSum += topicRequest.value() * weight;
            totalWeight += weight;
        }

        //Calculate Overall
        if (totalWeight  > 0) {

            double overall = weightedSum / totalWeight;

            RatingTopic overallTopic = new RatingTopic();
            overallTopic.setCategory(RatingCategory.OVERALL);
            overallTopic.setValue(overall);
            overallTopic.setRating(rating);

            rating.getTopics().add(overallTopic);
        }

        ratingRepository.save(rating);

        String code = lecture.getCode();
        auditWriter.writeStudentAction(
                student,
                AuditAction.RATING_SUBMITTED,
                AuditTargetType.RATING,
                rating.getId(),
                code == null || code.isBlank() ? lecture.getName() : code + " — " + lecture.getName(),
                Map.of(
                        "lectureId", lecture.getId(),
                        "topicCount", rating.getTopics().size()
                )
        );

        return new BasicResponse("Rating submitted successfully",true);

    }


    // Needs a transaction: open-in-view is disabled and this walks the lazy
    // topics collection of every rating. Without it this endpoint fails with
    // LazyInitializationException for any lecture that has ratings.
    @Transactional(readOnly = true)
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

    @Transactional
    public RatingsAverageResponse getOwnRating(String authHeader, UUID lectureId) {

        Student student = authService.verifyUser(authHeader);

        if(student == null) {
            return new RatingsAverageResponse("Error, cannot authenticate user", false, null);
        }

        Lecture lecture = lectureService.findById(lectureId);

        if (lecture == null) {
            return new RatingsAverageResponse("Error, cannot find lecture with id " + lectureId, false, null);
        }


        Rating rating = ratingRepository.findByStudentIdAndLectureId(student.getId(), lectureId).orElse(null);

        if (rating == null) {
            return new RatingsAverageResponse("Error, couldnt find rating for Lecture: " + lectureId, false, null);
        }



        List<TopicAverageResponse> topics = new ArrayList<>();


        for (RatingTopic topic : rating.getTopics()) {
            topics.add(new TopicAverageResponse(topic.getCategory(), topic.getValue()));
        }

        return new RatingsAverageResponse("Success, found " + topics.size() + " ratings", true, topics);
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