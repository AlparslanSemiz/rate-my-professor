package com.pse.user;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.UserRatingDto;
import com.pse.auth.dto.response.UserRatingResponse;
import com.pse.lecture.dto.response.LectureResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.service.LectureService;
import com.pse.rating.model.Rating;
import com.pse.rating.service.RatingService;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.enums.VoteType;
import com.pse.shared.util.ProfilePictureGenerator;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerVote;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentVote;
import com.pse.user.dto.StudentProfileResponse;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import com.pse.user.service.StudentService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTests {

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private StudentService studentService;


    @Test
    void getUserInformationReturnsErrorWhenStudentDoesNotExist() {

        UUID studentId = UUID.randomUUID();

        when(studentRepository.findById(studentId))
                .thenReturn(Optional.empty());


        StudentProfileResponse response = studentService.getUserInformation(studentId);


        assertFalse(response.success());
        assertEquals("Error, cannot authenticate user", response.message());
        assertNull(response.username());
        assertEquals(0, response.ratingsCount());
        assertEquals(0, response.commentsWritten());
        assertEquals(0, response.credibilityScore());
    }


    @Test
    void getUserInformationReturnsCorrectProfileInformation() {

        UUID studentId = UUID.randomUUID();

        Student student = mock(Student.class);

        Rating rating1 = mock(Rating.class);
        Rating rating2 = mock(Rating.class);

        Comment comment = mock(Comment.class);

        CommentVote commentUp1 = mock(CommentVote.class);
        CommentVote commentUp2 = mock(CommentVote.class);
        CommentVote commentDown = mock(CommentVote.class);

        Answer answer = mock(Answer.class);
        AnswerVote answerUp = mock(AnswerVote.class);

        when(student.getUsername()).thenReturn("testUser");

        when(student.getRatings())
                .thenReturn(List.of(rating1, rating2));

        when(student.getComments())
                .thenReturn(List.of(comment));

        when(student.getAnswers())
                .thenReturn(List.of(answer));



        //Comment:Up + Up + Down = 1
        when(comment.getVotes())
                .thenReturn(List.of(
                        commentUp1,
                        commentUp2,
                        commentDown
                ));

        when(commentUp1.getVote()).thenReturn(VoteType.UP);
        when(commentUp2.getVote()).thenReturn(VoteType.UP);
        when(commentDown.getVote()).thenReturn(VoteType.DOWN);



        //1 + 1 = 2
        when(answer.getVotes())
                .thenReturn(List.of(answerUp));

        when(answerUp.getVote()).thenReturn(VoteType.UP);


        when(studentRepository.findById(studentId))
                .thenReturn(Optional.of(student));


        try (
                MockedStatic<RatingService> ratingService = mockStatic(RatingService.class);
                MockedStatic<ProfilePictureGenerator> pictureGenerator = mockStatic(ProfilePictureGenerator.class)
        ) {

            ratingService
                    .when(() -> RatingService.calculateAverageScore(rating1))
                    .thenReturn(8.0);

            ratingService
                    .when(() -> RatingService.calculateAverageScore(rating2))
                    .thenReturn(6.0);

            pictureGenerator
                    .when(() ->
                            ProfilePictureGenerator.generateProfilePicture(student))
                    .thenReturn("profile-picture-url");


            StudentProfileResponse response =
                    studentService.getUserInformation(studentId);


            assertTrue(response.success());
            assertEquals("Success", response.message());

            assertEquals("testUser", response.username());

            assertEquals(7.0, response.averageRating(), 0.001);

            assertEquals(2, response.ratingsCount());
            assertEquals(1, response.commentsWritten());

            assertEquals(2, response.credibilityScore());

            verify(student).setCredibilityScore(2);
        }
    }


    @Test
    void getUserRatingsReturnsErrorWhenStudentDoesNotExist() {

        UUID studentId = UUID.randomUUID();

        when(studentRepository.findById(studentId))
                .thenReturn(Optional.empty());


        UserRatingResponse response = studentService.getUserRatings(studentId);


        assertFalse(response.success());
        assertEquals("Error, cannot authenticate user", response.message());
        assertTrue(response.ratings().isEmpty());
    }


    @Test
    void getUserRatingsReturnsAllStudentRatings() {

        UUID studentId = UUID.randomUUID();

        Student student = mock(Student.class);

        Rating rating1 = mock(Rating.class);
        Rating rating2 = mock(Rating.class);

        Lecture lecture1 = mock(Lecture.class);
        Lecture lecture2 = mock(Lecture.class);

        LectureResponse lectureResponse1 = mock(LectureResponse.class);

        LectureResponse lectureResponse2 = mock(LectureResponse.class);


        when(student.getRatings())
                .thenReturn(List.of(rating1, rating2));

        when(rating1.getLecture())
                .thenReturn(lecture1);

        when(rating2.getLecture())
                .thenReturn(lecture2);

        when(studentRepository.findById(studentId))
                .thenReturn(Optional.of(student));


        try (
                MockedStatic<LectureService> lectureService = mockStatic(LectureService.class);
                MockedStatic<RatingService> ratingService = mockStatic(RatingService.class)
        ) {

            lectureService
                    .when(() ->
                            LectureService.createLectureResponse(lecture1))
                    .thenReturn(lectureResponse1);

            lectureService
                    .when(() ->
                            LectureService.createLectureResponse(lecture2))
                    .thenReturn(lectureResponse2);


            ratingService
                    .when(() ->
                            RatingService.calculateAverageScore(rating1))
                    .thenReturn(8.25);

            ratingService
                    .when(() ->
                            RatingService.calculateAverageScore(rating2))
                    .thenReturn(6.75);


            UserRatingResponse response = studentService.getUserRatings(studentId);


            assertTrue(response.success());

            assertEquals(
                    "Success, found 2 ratings.",
                    response.message()
            );

            assertEquals(2, response.ratings().size());

            assertEquals(
                    new UserRatingDto(lectureResponse1, 8.25),
                    response.ratings().get(0)
            );

            assertEquals(
                    new UserRatingDto(lectureResponse2, 6.75),
                    response.ratings().get(1)
            );
        }
    }


    @Test
    void deleteAccountReturnsErrorWhenStudentIsNull() {

        BasicResponse response = studentService.deleteAccount(null);


        assertFalse(response.success());
        assertEquals(
                "Error, couldn't authenticate user",
                response.message()
        );

        verifyNoInteractions(studentRepository);
    }


    @Test
    void deleteAccountReturnsErrorWhenStudentCannotBeFound() {

        Student student = mock(Student.class);

        when(student.getKitEmail())
                .thenReturn("missing@student.kit.edu");

        when(studentRepository.findByKitEmail(
                "missing@student.kit.edu"
        )).thenReturn(Optional.empty());


        BasicResponse response = studentService.deleteAccount(student);


        assertFalse(response.success());

        assertEquals(
                "Error, couldn't find student",
                response.message()
        );

        verify(studentRepository, never()).save(any());
    }


    @Test
    void deleteAccountSoftDeletesStudent() {

        Student student = mock(Student.class);

        when(student.getKitEmail())
                .thenReturn("student@student.kit.edu");

        when(studentRepository.findByKitEmail(
                "student@student.kit.edu"
        )).thenReturn(Optional.of(student));


        BasicResponse response = studentService.deleteAccount(student);


        assertTrue(response.success());

        assertEquals(
                "Deleted Account successfully: student@student.kit.edu",
                response.message()
        );

        verify(student).setStatus(UserStatus.DELETED);
        verify(studentRepository).save(student);
    }


    @Test
    void softDeleteByKitEmailReturnsFalseWhenStudentDoesNotExist() {

        String email = "missing@student.kit.edu";

        when(studentRepository.findByKitEmail(email))
                .thenReturn(Optional.empty());


        boolean result = studentService.softDeleteByKitEmail(email);


        assertFalse(result);

        verify(studentRepository, never()).save(any());
    }


    @Test
    void softDeleteByKitEmailSetsStatusToDeleted() {

        String email = "student@student.kit.edu";

        Student student = mock(Student.class);

        when(studentRepository.findByKitEmail(email))
                .thenReturn(Optional.of(student));


        boolean result = studentService.softDeleteByKitEmail(email);


        assertTrue(result);

        verify(student).setStatus(UserStatus.DELETED);
        verify(studentRepository).save(student);
    }


    @Test
    void getAverageRatingReturnsZeroWhenStudentHasNoRatings() {

        Student student = mock(Student.class);

        when(student.getRatings())
                .thenReturn(List.of());


        double average = studentService.getAverageRating(student);


        assertEquals(0.0, average);
    }


    @Test
    void getAverageRatingReturnsAverageOfAllRatings() {

        Student student = mock(Student.class);

        Rating rating1 = mock(Rating.class);
        Rating rating2 = mock(Rating.class);
        Rating rating3 = mock(Rating.class);

        when(student.getRatings())
                .thenReturn(List.of(
                        rating1,
                        rating2,
                        rating3
                ));


        try (
                MockedStatic<RatingService> ratingService =
                        mockStatic(RatingService.class)
        ) {

            ratingService
                    .when(() ->
                            RatingService.calculateAverageScore(rating1))
                    .thenReturn(9.0);

            ratingService
                    .when(() ->
                            RatingService.calculateAverageScore(rating2))
                    .thenReturn(6.0);

            ratingService
                    .when(() ->
                            RatingService.calculateAverageScore(rating3))
                    .thenReturn(3.0);


            double average = studentService.getAverageRating(student);


            assertEquals(6.0, average, 0.001);
        }
    }
}