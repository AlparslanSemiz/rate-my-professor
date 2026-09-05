package com.pse.rating;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.service.LectureService;
import com.pse.rating.dto.request.RatingRequest;
import com.pse.rating.dto.request.RatingTopicRequest;
import com.pse.rating.dto.response.RatingCategoriesResponse;
import com.pse.rating.dto.response.RatingsAverageResponse;
import com.pse.rating.model.LectureType;
import com.pse.rating.model.Rating;
import com.pse.rating.model.RatingCategory;
import com.pse.rating.model.RatingTopic;
import com.pse.rating.repository.RatingRepository;
import com.pse.rating.service.RatingService;
import com.pse.user.model.Student;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RatingServiceTests {

    @Mock
    private LectureService lectureService;

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private AuditWriter auditWriter;

    @InjectMocks
    private RatingService ratingService;


    @Test
    void submitRatingReturnsErrorWhenLectureDoesNotExist() {

        Student student = mock(Student.class);
        RatingRequest request = mock(RatingRequest.class);

        UUID lectureId = UUID.randomUUID();

        when(request.lectureId())
                .thenReturn(lectureId);

        when(lectureService.getById(lectureId))
                .thenReturn(null);


        BasicResponse response =
                ratingService.submitRating(
                        student,
                        request
                );


        assertFalse(response.success());

        assertEquals(
                "Error, cannot find lecture with id "
                        + lectureId,
                response.message()
        );

        verify(ratingRepository, never()).save(any());

        verifyNoInteractions(auditWriter);
    }


    @Test
    void submitRatingCreatesNewRatingAndAddsOverallTopic() {

        Student student = mock(Student.class);
        Lecture lecture = mock(Lecture.class);

        RatingRequest request = mock(RatingRequest.class);

        RatingTopicRequest organization = mock(RatingTopicRequest.class);

        UUID studentId = UUID.randomUUID();

        UUID lectureId = UUID.randomUUID();


        when(student.getId())
                .thenReturn(studentId);

        when(request.lectureId())
                .thenReturn(lectureId);

        when(request.topics())
                .thenReturn(List.of(organization));

        when(organization.category())
                .thenReturn(
                        RatingCategory.ORGANIZATION
                );

        when(organization.value())
                .thenReturn(4.0);

        when(lectureService.getById(lectureId))
                .thenReturn(lecture);

        when(ratingRepository
                .findByStudentIdAndLectureId(
                        studentId,
                        lectureId
                ))
                .thenReturn(Optional.empty());

        when(lecture.getCode())
                .thenReturn("CS101");

        when(lecture.getName())
                .thenReturn("Algorithms");

        when(lecture.getId())
                .thenReturn(lectureId);


        BasicResponse response =
                ratingService.submitRating(
                        student,
                        request
                );


        assertTrue(response.success());

        assertEquals(
                "Rating submitted successfully",
                response.message()
        );


        ArgumentCaptor<Rating> captor =
                ArgumentCaptor.forClass(
                        Rating.class
                );

        verify(ratingRepository).save(captor.capture());


        Rating saved = captor.getValue();

        assertSame(student, saved.getStudent());
        assertSame(lecture, saved.getLecture());

        assertEquals(
                2,
                saved.getTopics().size()
        );


        RatingTopic normalTopic =
                saved.getTopics()
                        .stream()
                        .filter(topic ->
                                topic.getCategory()
                                        == RatingCategory.ORGANIZATION)
                        .findFirst()
                        .orElseThrow();

        assertEquals(
                4.0,
                normalTopic.getValue(),
                0.001
        );


        RatingTopic overall =
                saved.getTopics()
                        .stream()
                        .filter(topic ->
                                topic.getCategory()
                                        == RatingCategory.OVERALL)
                        .findFirst()
                        .orElseThrow();


        assertEquals(
                4.0,
                overall.getValue(),
                0.001
        );


        verify(auditWriter)
                .writeStudentAction(
                        eq(student),
                        eq(AuditAction.RATING_SUBMITTED),
                        eq(AuditTargetType.RATING),
                        nullable(UUID.class),
                        eq("CS101 — Algorithms"),
                        anyMap()
                );
    }


    @Test
    void submitRatingIgnoresOverallSentByClient() {

        Student student = mock(Student.class);
        Lecture lecture = mock(Lecture.class);

        RatingRequest request = mock(RatingRequest.class);

        RatingTopicRequest organization = mock(RatingTopicRequest.class);

        RatingTopicRequest maliciousOverall = mock(RatingTopicRequest.class);

        UUID studentId = UUID.randomUUID();
        UUID lectureId = UUID.randomUUID();


        when(student.getId())
                .thenReturn(studentId);

        when(request.lectureId())
                .thenReturn(lectureId);

        when(request.topics())
                .thenReturn(
                        List.of(
                                organization,
                                maliciousOverall
                        )
                );

        when(organization.category())
                .thenReturn(
                        RatingCategory.ORGANIZATION
                );

        when(organization.value())
                .thenReturn(4.0);

        when(maliciousOverall.category())
                .thenReturn(
                        RatingCategory.OVERALL
                );

        when(lectureService.getById(lectureId))
                .thenReturn(lecture);

        when(ratingRepository
                .findByStudentIdAndLectureId(
                        studentId,
                        lectureId
                ))
                .thenReturn(Optional.empty());


        ratingService.submitRating(student, request);


        ArgumentCaptor<Rating> captor = ArgumentCaptor.forClass(Rating.class);

        verify(ratingRepository).save(captor.capture());


        Rating saved = captor.getValue();


        long overallTopics =
                saved.getTopics()
                        .stream()
                        .filter(topic ->
                                topic.getCategory()
                                        == RatingCategory.OVERALL)
                        .count();


        assertEquals(1, overallTopics);
    }


    @Test
    void submitRatingOverwritesExistingRatingInsteadOfCreatingSecondRating() {

        Student student = mock(Student.class);
        Lecture lecture = mock(Lecture.class);

        RatingRequest request = mock(RatingRequest.class);

        RatingTopicRequest newTopic = mock(RatingTopicRequest.class);

        Rating existing = mock(Rating.class);

        List<RatingTopic> existingTopics = new ArrayList<>();

        RatingTopic oldTopic = new RatingTopic();

        oldTopic.setCategory(RatingCategory.ORGANIZATION);

        oldTopic.setValue(1.0);

        existingTopics.add(oldTopic);


        UUID studentId = UUID.randomUUID();

        UUID lectureId = UUID.randomUUID();


        when(student.getId())
                .thenReturn(studentId);

        when(request.lectureId())
                .thenReturn(lectureId);

        when(request.topics())
                .thenReturn(List.of(newTopic));

        when(newTopic.category())
                .thenReturn(
                        RatingCategory.ORGANIZATION
                );

        when(newTopic.value())
                .thenReturn(5.0);

        when(lectureService.getById(lectureId))
                .thenReturn(lecture);

        when(ratingRepository
                .findByStudentIdAndLectureId(
                        studentId,
                        lectureId
                ))
                .thenReturn(
                        Optional.of(existing)
                );

        when(existing.getTopics())
                .thenReturn(existingTopics);


        BasicResponse response =
                ratingService.submitRating(
                        student,
                        request
                );


        assertTrue(response.success());

        assertEquals(
                2,
                existingTopics.size()
        );

        assertFalse(
                existingTopics.contains(oldTopic)
        );


        verify(ratingRepository).flush();

        verify(ratingRepository).save(existing);
    }



    @Test
    void getRatingsCalculatesAveragePerCategory() {

        UUID lectureId = UUID.randomUUID();

        Rating rating1 = mock(Rating.class);

        Rating rating2 = mock(Rating.class);


        RatingTopic first =
                topic(
                        RatingCategory.ORGANIZATION,
                        4.0
                );

        RatingTopic second =
                topic(
                        RatingCategory.ORGANIZATION,
                        2.0
                );


        when(rating1.getTopics())
                .thenReturn(List.of(first));

        when(rating2.getTopics())
                .thenReturn(List.of(second));

        when(ratingRepository
                .findByLectureId(lectureId))
                .thenReturn(
                        List.of(
                                rating1,
                                rating2
                        )
                );


        RatingsAverageResponse response = ratingService.getRatings(lectureId);


        assertTrue(response.success());

        assertEquals(
                "Success, found 1 ratings",
                response.message()
        );

        assertEquals(
                1,
                response.ratings().size()
        );

        assertEquals(
                RatingCategory.ORGANIZATION,
                response.ratings()
                        .getFirst()
                        .category()
        );

        assertEquals(
                3.0,
                response.ratings()
                        .getFirst()
                        .value(),
                0.001
        );
    }


    @Test
    void getRatingsReturnsEmptyListWhenNoRatingsExist() {

        UUID lectureId = UUID.randomUUID();

        when(ratingRepository.findByLectureId(lectureId))
                .thenReturn(List.of());


        RatingsAverageResponse response = ratingService.getRatings(lectureId);


        assertTrue(response.success());

        assertEquals(
                0,
                response.ratings().size()
        );

        assertEquals(
                "Success, found 0 ratings",
                response.message()
        );
    }



    @Test
    void getOwnRatingReturnsErrorWhenLectureDoesNotExist() {

        Student student = mock(Student.class);

        UUID lectureId = UUID.randomUUID();

        when(lectureService.getById(lectureId))
                .thenReturn(null);


        RatingsAverageResponse response =
                ratingService.getOwnRating(
                        student,
                        lectureId
                );


        assertFalse(response.success());

        assertEquals(
                "Error, cannot find lecture with id "
                        + lectureId,
                response.message()
        );

        assertNull(response.ratings());
    }


    @Test
    void getOwnRatingReturnsErrorWhenStudentHasNoRating() {

        Student student = mock(Student.class);

        Lecture lecture = mock(Lecture.class);

        UUID studentId = UUID.randomUUID();

        UUID lectureId = UUID.randomUUID();


        when(student.getId())
                .thenReturn(studentId);

        when(lectureService.getById(lectureId))
                .thenReturn(lecture);

        when(ratingRepository
                .findByStudentIdAndLectureId(
                        studentId,
                        lectureId
                ))
                .thenReturn(Optional.empty());


        RatingsAverageResponse response =
                ratingService.getOwnRating(
                        student,
                        lectureId
                );


        assertFalse(response.success());

        assertEquals(
                "Error, couldnt find rating for Lecture: "
                        + lectureId,
                response.message()
        );

        assertNull(response.ratings());
    }


    @Test
    void getOwnRatingReturnsStudentTopics() {

        Student student = mock(Student.class);

        Lecture lecture = mock(Lecture.class);

        Rating rating = mock(Rating.class);

        UUID studentId = UUID.randomUUID();

        UUID lectureId = UUID.randomUUID();


        RatingTopic organization =
                topic(
                        RatingCategory.ORGANIZATION,
                        4.0
                );

        RatingTopic overall =
                topic(
                        RatingCategory.OVERALL,
                        4.0
                );


        when(student.getId())
                .thenReturn(studentId);

        when(lectureService.getById(lectureId))
                .thenReturn(lecture);

        when(ratingRepository
                .findByStudentIdAndLectureId(
                        studentId,
                        lectureId
                ))
                .thenReturn(
                        Optional.of(rating)
                );

        when(rating.getTopics())
                .thenReturn(
                        List.of(
                                organization,
                                overall
                        )
                );


        RatingsAverageResponse response =
                ratingService.getOwnRating(
                        student,
                        lectureId
                );


        assertTrue(response.success());

        assertEquals(
                2,
                response.ratings().size()
        );

        assertEquals(
                "Success, found 2 ratings",
                response.message()
        );
    }



    @Test
    void getRatingCategoriesReturnsCategoriesOfLectureType() {

        UUID lectureId = UUID.randomUUID();

        Lecture lecture = mock(Lecture.class);


        LectureType lectureType =
                Arrays.stream(
                                LectureType.values()
                        )
                        .filter(type ->
                                !type.getDefaultCategories()
                                        .isEmpty())
                        .findFirst()
                        .orElseThrow();


        when(lectureService.getById(lectureId))
                .thenReturn(lecture);

        when(lecture.getLectureType())
                .thenReturn(lectureType);


        RatingCategoriesResponse response = ratingService.getRatingCategories(lectureId);


        assertTrue(response.success());

        assertEquals(
                lectureType
                        .getDefaultCategories()
                        .size(),
                response.categories().size()
        );

        assertEquals(
                "Found "
                        + lectureType
                        .getDefaultCategories()
                        .size()
                        + " categories",
                response.message()
        );
    }


    @Test
    void calculateAverageScoreReturnsZeroWhenThereAreNoTopics() {

        Rating rating = mock(Rating.class);

        when(rating.getTopics())
                .thenReturn(List.of());


        double average = RatingService.calculateAverageScore(rating);


        assertEquals(
                0.0,
                average,
                0.001
        );
    }


    @Test
    void calculateAverageScoreCalculatesAverageCorrectly() {

        Rating rating = mock(Rating.class);


        // Same category => same weight.
        // Therefore (4 + 2) / 2 = 3.
        RatingTopic first =
                topic(
                        RatingCategory.ORGANIZATION,
                        4.0
                );

        RatingTopic second =
                topic(
                        RatingCategory.ORGANIZATION,
                        2.0
                );


        when(rating.getTopics())
                .thenReturn(
                        List.of(
                                first,
                                second
                        )
                );


        double average = RatingService.calculateAverageScore(rating);


        assertEquals(3.0, average, 0.001);
    }



    private RatingTopic topic(RatingCategory category, double value) {

        RatingTopic topic = new RatingTopic();

        topic.setCategory(category);
        topic.setValue(value);

        return topic;
    }
}