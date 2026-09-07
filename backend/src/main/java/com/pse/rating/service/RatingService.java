package com.pse.rating.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    private final LectureService lectureService;


    private final RatingRepository ratingRepository;
    private final AuditWriter auditWriter;

    public RatingService(LectureService lectureService, RatingRepository ratingRepository, AuditWriter auditWriter) {
        this.lectureService = lectureService;
        this.ratingRepository = ratingRepository;
        this.auditWriter = auditWriter;
    }


    @Transactional
    public BasicResponse submitRating(Student student, RatingRequest request) {

        Lecture lecture = lectureService.getById(request.lectureId());

        if (lecture == null) {
            return new BasicResponse("Error, cannot find lecture with id " + request.lectureId(), false);
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

        }

        //TODO: idk ob heir ein bug ensteht weil wir das rating objekt noch nicht gespeicehrt haben

        //Add overall Rating
        double overallRating = calculateAverageScore(rating);
        RatingTopic overallTopic = new RatingTopic();
        overallTopic.setCategory(RatingCategory.OVERALL);
        overallTopic.setValue(overallRating);
        overallTopic.setRating(rating);

        rating.getTopics().add(overallTopic);


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
    public RatingsAverageResponse getOwnRating(Student student, UUID lectureId) {

        Lecture lecture = lectureService.getById(lectureId);

        if (lecture == null) {
            return new RatingsAverageResponse("Error, cannot find lecture with id " + lectureId, false, null);
        }

        Rating rating = ratingRepository.findByStudentIdAndLectureId(student.getId(), lectureId).orElse(null);

        if (rating == null) {
            return new RatingsAverageResponse("Error, couldn't find rating for Lecture: " + lectureId, false, null);
        }

        List<TopicAverageResponse> topics = new ArrayList<>();

        for (RatingTopic topic : rating.getTopics()) {
            topics.add(new TopicAverageResponse(topic.getCategory(), topic.getValue()));
        }

        return new RatingsAverageResponse("Success, found " + topics.size() + " ratings", true, topics);
    }


    public RatingCategoriesResponse getRatingCategories(UUID lectureId) {

        Lecture lecture = lectureService.getById(lectureId);

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



    //TODO: Ich bin mir unsicher, eig haben wir ja eine OVERALL kategorie, also müsssen das nicht jedes mal berechnen
    public static double calculateAverageScore(Rating rating){

        // Overall Rating berechnen
        double weightedSum = 0;
        double totalWeight = 0;

        for (RatingTopic topic : rating.getTopics()) {

            double weight = topic.getCategory().getDefaultWeight();

            weightedSum += topic.getValue() * weight;
            totalWeight += weight;
        }

        if (totalWeight == 0) {
            return 0;
        }
        double averageScore = weightedSum / totalWeight;

        return BigDecimal.valueOf(averageScore)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();

    }


}