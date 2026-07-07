package com.example.myapplication_java;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import com.example.myapplication_java.DomainModel.Comment;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.LectureOffering;
import com.example.myapplication_java.DomainModel.Notification;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Rating;
import com.example.myapplication_java.DomainModel.RatingCategory;
import com.example.myapplication_java.DomainModel.RatingTopic;
import com.example.myapplication_java.DomainModel.Review;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.DomainModel.SemesterSeason;
import com.example.myapplication_java.DomainModel.User;
import com.example.myapplication_java.DomainModel.UserStatistics;
import com.example.myapplication_java.DomainModel.Vote;
import com.example.myapplication_java.DomainModel.VoteType;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.Responses.ServerResponse;

import org.junit.Test;

import java.util.Collections;
import java.util.Date;

public class DomainModelTest {
    @Test
    public void professorConstructorStoresImplementedFields() {
        Professor professor = new Professor(
                "prof-1",
                "Ada",
                "Lovelace",
                4.5f,
                12
        );

        assertEquals("prof-1", professor.id);
        assertEquals("Ada", professor.firstName);
        assertEquals("Lovelace", professor.lastName);
        assertEquals(4.5f, professor.averageRating, 0.001f);
        assertEquals(12, professor.ratingCount);
    }

    @Test
    public void lectureConstructorStoresImplementedFields() {
        Lecture lecture = createLecture();

        assertEquals("lecture-1", lecture.id);
        assertEquals("Algorithms", lecture.name);
        assertEquals("240001", lecture.code);
        assertEquals(2026, lecture.semesterYear);
        assertEquals(SemesterSeason.WINTER, lecture.semesterSeason);
    }

    @Test
    public void ratingConstructorStoresImplementedFields() {
        RatingTopic topic = new RatingTopic("Clarity", 5);

        Rating rating = new Rating("lecture-1", Collections.singletonList(topic));

        assertEquals("lecture-1", rating.lectureId);
        assertEquals("Clarity", topic.name);
        assertEquals(5, topic.value);
    }

    @Test
    public void ratingCategoryConstructorStoresImplementedFields() {
        RatingCategory category = new RatingCategory(
                "category-1",
                "Clarity",
                "How clearly the material is explained"
        );
    }

    @Test
    public void commentConstructorStoresReadableCommentFields() {
        Date createdAt = new Date(1_700_000_000_000L);
        Date updatedAt = new Date(1_700_000_060_000L);

        Comment comment = new Comment(
                "comment-1",
                "Die Vorlesung war gut strukturiert.",
                createdAt,
                updatedAt
        );

        assertEquals("comment-1", comment.commentId);
        assertEquals("Die Vorlesung war gut strukturiert.", comment.text);
        assertSame(createdAt, comment.createdAt);
        assertSame(updatedAt, comment.updatedAt);
    }

    @Test
    public void reviewConstructorStoresProfessorRatingAndCommentText() {
        Date createdAt = new Date(1_700_000_000_000L);
        Date updatedAt = new Date(1_700_000_060_000L);

        Review review = new Review(
                "review-1",
                createdAt,
                updatedAt,
                4.25,
                "Fair bewertet, aber anspruchsvoll."
        );

        assertEquals("review-1", review.reviewId);
        assertSame(createdAt, review.createdAt);
        assertSame(updatedAt, review.updatedAt);
        assertEquals(4.25, review.averageGrade, 0.001);
        assertEquals("Fair bewertet, aber anspruchsvoll.", review.text);
    }

    @Test
    public void userConstructorStoresVerifiedKitStudentIdentityFields() {
        User user = new User(
                "user-1",
                "student@kit.edu",
                "uxabc",
                "KIT Student",
                "/profiles/user-1.png"
        );

        assertEquals("user-1", user.userId);
        assertEquals("student@kit.edu", user.kitEmail);
        assertEquals("uxabc", user.kitUserCode);
        assertEquals("KIT Student", user.displayName);
        assertEquals("/profiles/user-1.png", user.profileImagePath);
    }

    @Test
    public void loginRequestStoresKitMailAndAuthToken() {
        LoginRequest request = new LoginRequest("student@kit.edu", "123456");

        assertEquals("student@kit.edu", request.email);
        assertEquals("123456", request.loginToken);
    }

    @Test
    public void serverResponseStoresLoginVerificationResult() {
        ServerResponse response = new ServerResponse("Login accepted", true);

        assertEquals("Login accepted", response.message);
        assertEquals(true, response.success);
    }

    @Test
    public void professorGetLecturesCurrentlyReturnsEmptyList() {
        Professor professor = new Professor("prof-1", "Ada", "Lovelace", 4.5f, 12);

        assertTrue(professor.getLectures().isEmpty());
    }

    @Test
    public void lectureGetProfessorsCurrentlyReturnsEmptyList() {
        Lecture lecture = createLecture();

        assertTrue(lecture.getProfessors().isEmpty());
    }

    @Test
    public void commentVoteScoreDefaultsToZero() {
        Comment comment = new Comment("comment-1", "Helpful", new Date(), new Date());
        Comment reply = new Comment("comment-2", "Reply", new Date(), new Date());

        comment.addReply(reply);

        assertEquals(0, comment.getVoteScore());
    }

    @Test
    public void lectureOfferingStoresRelationsAndCurrentAverageRatingPlaceholder() {
        Lecture lecture = createLecture();
        Professor professor = new Professor("prof-1", "Ada", "Lovelace", 4.5f, 12);
        Semester semester = new Semester(2026, SemesterSeason.WINTER);

        LectureOffering offering = new LectureOffering("offering-1", lecture, professor, semester);

        assertEquals("offering-1", offering.offeringId);
        assertSame(lecture, offering.lecture);
        assertSame(professor, offering.professor);
        assertSame(semester, offering.semester);
        assertEquals(5.0, offering.getAverageRating(), 0.001);
    }

    @Test
    public void notificationConstructorStoresFieldsAndMarkAsReadIsCurrentlyNoOp() {
        Date createdAt = new Date(1_700_000_000_000L);
        Notification notification = new Notification(
                "notification-1",
                "New comment",
                createdAt,
                false
        );

        notification.markAsRead();

        assertEquals("notification-1", notification.notificationId);
        assertEquals("New comment", notification.message);
        assertSame(createdAt, notification.createdAt);
        assertFalse(notification.isRead);
    }

    @Test
    public void semesterConstructorStoresImplementedFields() {
        Semester semester = new Semester(2026, SemesterSeason.SUMMER);

        assertEquals(2026, semester.semesterYear);
        assertEquals(SemesterSeason.SUMMER, semester.semesterSeason);
    }

    @Test
    public void userStatisticsConstructorStoresImplementedFields() {
        UserStatistics statistics = new UserStatistics(3, 7, 2.5, 4.1);

        statistics.calculateStatistics();

        assertEquals(3, statistics.reviewCount);
        assertEquals(7, statistics.commentCount);
        assertEquals(2.5, statistics.upvoteDownvoteRatio, 0.001);
        assertEquals(4.1, statistics.averageGivenGrade, 0.001);
    }

    @Test
    public void voteConstructorStoresImplementedFields() {
        Date createdAt = new Date(1_700_000_000_000L);
        Comment comment = new Comment("comment-1", "Helpful", createdAt, createdAt);

        Vote vote = new Vote("vote-1", createdAt, VoteType.UPVOTE, comment);

        assertEquals("vote-1", vote.voteId);
        assertSame(createdAt, vote.createdAt);
        assertEquals(VoteType.UPVOTE, vote.type);
        assertSame(comment, vote.comment);
    }

    @Test
    public void userActionPlaceholdersDoNotMutateCurrentDomainObjects() {
        User user = new User("user-1", "student@kit.edu", "uxabc", "KIT Student", "");
        Date createdAt = new Date(1_700_000_000_000L);
        Review review = new Review("review-1", createdAt, createdAt, 4.0, "Helpful");
        Comment comment = new Comment("comment-1", "Good lecture", createdAt, createdAt);

        user.createReview(review);
        user.writeComment(comment);
        user.voteComment(comment, VoteType.DOWNVOTE);

        assertEquals("review-1", review.reviewId);
        assertEquals("comment-1", comment.commentId);
        assertEquals(0, comment.getVoteScore());
    }

    @Test
    public void enumValuesExposeSupportedSemesterAndVoteTypes() {
        assertEquals(SemesterSeason.SUMMER, SemesterSeason.valueOf("SUMMER"));
        assertEquals(SemesterSeason.WINTER, SemesterSeason.valueOf("WINTER"));
        assertEquals(VoteType.UPVOTE, VoteType.valueOf("UPVOTE"));
        assertEquals(VoteType.DOWNVOTE, VoteType.valueOf("DOWNVOTE"));
    }

    private Lecture createLecture() {
        return new Lecture(
                "lecture-1",
                "Algorithms",
                "240001",
                2026,
                SemesterSeason.WINTER,
                true,
                "prof-1",
                3,
                4
        );
    }
}
