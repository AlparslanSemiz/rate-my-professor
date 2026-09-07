package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.example.ratemyprofessor.DomainModel.Comment;
import com.example.ratemyprofessor.DomainModel.CommentModel;
import com.example.ratemyprofessor.DomainModel.CommentType;
import com.example.ratemyprofessor.DomainModel.Instructor;
import com.example.ratemyprofessor.DomainModel.LectureModel;
import com.example.ratemyprofessor.DomainModel.Notification;
import com.example.ratemyprofessor.DomainModel.OfferingRating;
import com.example.ratemyprofessor.DomainModel.Professor;
import com.example.ratemyprofessor.DomainModel.RatingCategory;
import com.example.ratemyprofessor.DomainModel.Review;
import com.example.ratemyprofessor.DomainModel.SelectionType;
import com.example.ratemyprofessor.DomainModel.SemesterSeason;
import com.example.ratemyprofessor.DomainModel.User;
import com.example.ratemyprofessor.DomainModel.UserStatistics;
import com.example.ratemyprofessor.DomainModel.VoteType;
import com.example.ratemyprofessor.ServerCommunication.APIService;
import com.example.ratemyprofessor.ServerCommunication.ContentStatus;
import com.example.ratemyprofessor.ServerCommunication.ImageRetriever;
import com.example.ratemyprofessor.ServerCommunication.ReportReason;
import com.example.ratemyprofessor.ServerCommunication.Requests.CommentReportRequest;
import com.example.ratemyprofessor.ServerCommunication.Requests.PostCommentRequest;
import com.example.ratemyprofessor.ServerCommunication.Requests.RatingRequest;
import com.example.ratemyprofessor.ServerCommunication.Requests.RatingTopicRequest;
import com.example.ratemyprofessor.ServerCommunication.Requests.SubmitAnswerRequest;
import com.example.ratemyprofessor.ServerCommunication.Requests.VoteRequest;
import com.example.ratemyprofessor.ServerCommunication.Responses.AnswerResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.BasicResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.LectureResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.PersonalStatisticsResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.ProfessorShortResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.RatingCategoriesResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.RatingCategoryResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.StudentProfileResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.UserRatingDto;
import com.example.ratemyprofessor.ServerCommunication.Responses.UserRatingResponse;

import org.junit.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Date;

public class ModelRequestResponseCoverageTest {

    @Test
    public void requestRecordsExposeFields() {
        RatingTopicRequest topic = new RatingTopicRequest(RatingCategory.ROOM, 4.25);
        RatingRequest rating = new RatingRequest("lecture-1", Collections.singletonList(topic));
        PostCommentRequest comment = new PostCommentRequest("lecture-1", "Solid lecture");
        SubmitAnswerRequest answer = new SubmitAnswerRequest("comment-1", "I agree");
        CommentReportRequest report = new CommentReportRequest(
                "comment-1",
                ReportReason.OTHER,
                "Needs a second look"
        );
        VoteRequest vote = new VoteRequest(VoteType.DOWN);

        assertEquals("lecture-1", rating.lectureId());
        assertEquals(topic, rating.topics().get(0));
        assertEquals(RatingCategory.ROOM, topic.category());
        assertEquals(4.25, topic.value(), 0.001);
        assertEquals("Solid lecture", comment.content());
        assertEquals("comment-1", answer.commentID());
        assertEquals(ReportReason.OTHER, report.reportReason());
        assertEquals(VoteType.DOWN, vote.voteType());
    }

    @Test
    public void responseRecordsExposeFields() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 8, 1, 12, 30);
        AnswerResponse answer = new AnswerResponse(
                "answer-1",
                "Reply",
                ContentStatus.VISIBLE,
                "anon",
                createdAt
        );
        BasicResponse basic = new BasicResponse("ok", true);
        ProfessorShortResponse professor = new ProfessorShortResponse("prof-1", "Ada", "Lovelace", true);
        LectureResponse lecture = new LectureResponse(
                "lecture-1",
                "Algorithms",
                "240001",
                2026,
                SemesterSeason.WS,
                true,
                Collections.singletonList(professor),
                3,
                5
        );
        UserRatingDto rating = new UserRatingDto(lecture, 4.6);
        UserRatingResponse ratings = new UserRatingResponse("ok", true, Collections.singletonList(rating));
        StudentProfileResponse student = new StudentProfileResponse(
                "ok",
                true,
                "student",
                "/profiles/student.png",
                4.3,
                7,
                2,
                91
        );
        PersonalStatisticsResponse statistics = new PersonalStatisticsResponse(
                "ok",
                true,
                "student",
                "/profiles/student.png",
                4.1f,
                6,
                3,
                88
        );
        RatingCategoryResponse catResp = new RatingCategoryResponse(RatingCategory.ROOM, "Room", 4.0);
        RatingCategoriesResponse catsResp = new RatingCategoriesResponse("ok", true, Collections.singletonList(catResp));

        assertEquals("answer-1", answer.commentId());
        assertEquals(ContentStatus.VISIBLE, answer.status());
        assertEquals(createdAt, answer.createdAt());
        assertTrue(basic.success());
        assertEquals("prof-1", professor.id());
        assertTrue(professor.active());
        assertEquals(professor, lecture.professors().get(0));
        assertEquals(5, lecture.ratingCount());
        assertEquals(lecture, rating.lecture());
        assertEquals(4.6, rating.overallRating(), 0.001);
        assertEquals(rating, ratings.ratings().get(0));
        assertEquals("student", student.username());
        assertEquals(91, student.credibilityScore());
        assertEquals(4.1f, statistics.averageRating(), 0.001f);
        assertEquals(3, statistics.writtencomments());
        assertEquals(catResp, catsResp.categories().get(0));
        assertEquals(RatingCategory.ROOM, catResp.category());
    }

    @Test
    public void domainClassesExposeFieldsAndNoOpMethodsAreCallable() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 8, 2, 9, 15);
        Date date = new Date(123456789L);
        Comment comment = new Comment(
                "comment-1",
                "Useful",
                ContentStatus.VISIBLE,
                "anon",
                "lecture-1",
                "/profiles/anon.png",
                createdAt,
                1,
                4,
                Collections.emptyList()
        );
        CommentModel commentModel = new CommentModel(
                "comment-1",
                null,
                "Useful",
                ContentStatus.VISIBLE,
                "anon",
                "lecture-1",
                createdAt,
                1,
                4
        );
        Instructor instructor = new Instructor("lecture-1", "Algorithms", "prof-1");
        Review review = new Review("review-1", date, date, 4.0, "Well paced");
        Notification notification = new Notification("notification-1", "New reply", date, false);
        Notification detailedNotification = new Notification(
                "notification-2",
                "New reply",
                date,
                false,
                "helper",
                "Agreed",
                "Algorithms WS26",
                "lecture-1",
                "comment-1",
                "reply-1"
        );
        OfferingRating offeringRating = new OfferingRating();
        offeringRating.offeringID = "offering-1";
        offeringRating.category = "ROOM";
        offeringRating.value = 3.5;
        Professor professor = new Professor("prof-1", "Ada", "Lovelace", 4.8f, 9);
        LectureModel lectureModel = new LectureModel(
                "lecture-1",
                "Algorithms",
                "240001",
                2026,
                SemesterSeason.WS,
                true,
                Collections.singletonList(professor),
                2,
                8,
                3.3
        );
        User user = new User("user-1", "student@kit.edu", "uxabc", "student", "/profile.png");
        UserStatistics statistics = new UserStatistics(1, 2, 3.0, 4.0);

        assertEquals("comment-1", commentModel.commentID());
        assertNull(commentModel.parentID());
        assertEquals(ContentStatus.VISIBLE, commentModel.status());
        assertEquals(1, commentModel.downVotes());
        assertEquals("lecture-1", instructor.lectureID);
        assertEquals("prof-1", instructor.professorID);
        assertEquals("Algorithms", instructor.lectureTitle);
        assertEquals("review-1", review.reviewId());
        assertEquals("Well paced", review.text());
        assertFalse(notification.isRead);
        assertEquals("", notification.actorUsername);
        detailedNotification.markAsRead();
        assertTrue(detailedNotification.isRead);
        assertEquals("reply-1", detailedNotification.replyCommentId);
        assertEquals("offering-1", offeringRating.offeringID);
        assertEquals(3.5, offeringRating.value, 0.001);
        assertTrue(professor.getLectures().isEmpty());
        assertEquals(professor, lectureModel.professors().get(0));
        assertEquals(8, lectureModel.ratingCount());
        assertEquals(3.3, lectureModel.averageRating());

        user.createReview(review);
        user.writeComment(comment);
        user.voteComment(comment, VoteType.UP);
        statistics.calculateStatistics();

        assertEquals("user-1", user.userId);
        assertEquals(1, statistics.reviewCount);
    }

    @Test
    public void enumsExposeExpectedValues() {
        assertEquals(CommentType.COMMENT, CommentType.valueOf("COMMENT"));
        assertEquals(CommentType.REPLY, CommentType.values()[1]);
        assertEquals(SelectionType.PROFESSORS, SelectionType.valueOf("PROFESSORS"));
        assertEquals(SelectionType.LECTURES, SelectionType.values()[1]);
        assertEquals(ContentStatus.DELETED, ContentStatus.valueOf("DELETED"));
        assertEquals(8, ReportReason.values().length);
        assertEquals("Raum", RatingCategory.ROOM.getDisplayName());

        for (RatingCategory category : RatingCategory.values()) {
            assertNotNull(category.getDisplayName());
            assertFalse(category.getDisplayName().isEmpty());
        }
    }

    @Test
    public void imageRetrieverRequestsPngVariantAndReturnsNullUntilImplemented() {
        String[] requestedUrl = new String[1];
        APIService apiService = (APIService) Proxy.newProxyInstance(
                APIService.class.getClassLoader(),
                new Class<?>[]{APIService.class},
                (proxy, method, args) -> {
                    if ("downloadImage".equals(method.getName())) {
                        requestedUrl[0] = (String) args[0];
                        return null;
                    }
                    throw new UnsupportedOperationException(method.getName());
                }
        );

        ImageRetriever retriever = new ImageRetriever(apiService, "https://example.test/profile.svg");

        assertNull(retriever.getPicture());
        assertEquals("https://example.test/profile.png", requestedUrl[0]);
    }
}
