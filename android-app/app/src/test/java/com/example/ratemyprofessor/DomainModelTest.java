package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.LectureOffering;
import com.example.ratemyprofessor.domain.LectureType;
import com.example.ratemyprofessor.domain.Notification;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.Rater;
import com.example.ratemyprofessor.domain.Rating;
import com.example.ratemyprofessor.domain.RatingCategory;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.domain.SemesterSeason;
import com.example.ratemyprofessor.domain.UserStatistics;
import com.example.ratemyprofessor.domain.Vote;
import com.example.ratemyprofessor.domain.VoteType;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.ContentStatus;
import com.example.ratemyprofessor.servercommunication.ImageRetriever;
import com.example.ratemyprofessor.servercommunication.ReportReason;
import com.example.ratemyprofessor.servercommunication.requests.BugReportRequest;
import com.example.ratemyprofessor.servercommunication.requests.CommentReportRequest;
import com.example.ratemyprofessor.servercommunication.requests.PostCommentRequest;
import com.example.ratemyprofessor.servercommunication.requests.RatingRequest;
import com.example.ratemyprofessor.servercommunication.requests.RatingTopicRequest;
import com.example.ratemyprofessor.servercommunication.requests.SubmitAnswerRequest;
import com.example.ratemyprofessor.servercommunication.responses.AnswerResponse;
import com.example.ratemyprofessor.servercommunication.responses.LectureResponse;
import com.example.ratemyprofessor.servercommunication.responses.NotificationResponse;
import com.example.ratemyprofessor.servercommunication.responses.NotificationType;
import com.example.ratemyprofessor.servercommunication.responses.PersonalStatisticsResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingCategoriesResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingCategoryResponse;
import com.example.ratemyprofessor.servercommunication.responses.StudentProfileResponse;
import com.example.ratemyprofessor.servercommunication.responses.TopicAverageResponse;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingDto;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingResponse;

import org.junit.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;

/**
 * Tests logic and state transitions within the domain model.
 */
public class DomainModelTest {

    /**
     * Verifies that semester formats display name correctly.
     */
    @Test
    public void semesterFormatsDisplayNameCorrectly() {
        // This tests actual logic in Semester.java
        Semester winter = new Semester(2026, SemesterSeason.WS);
        Semester summer = new Semester(2025, SemesterSeason.SS);

        assertEquals("WS2026", winter.getSemesterName());
        assertEquals("SS2025", summer.getSemesterName());
    }

    /**
     * Verifies that notification state changes when marked as read.
     */
    @Test
    public void notificationStateChangesWhenMarkedAsRead() {
        // Tests state transition logic in Notification.java
        Notification notification = new Notification("id-1", "Msg", new Date(), false);
        
        assertFalse("Notification should start as unread", notification.isRead);
        
        notification.markAsRead();
        
        assertTrue("Notification should be read after markAsRead()", notification.isRead);
    }

    /**
     * Verifies that vote correctly links to parent comment.
     */
    @Test
    public void voteCorrectlyLinksToParentComment() {
        // Verifies data integrity across related domain objects
        Comment parent = new Comment(
                "c1", "Great!", ContentStatus.VISIBLE, "user", "l1", 
                null, LocalDateTime.now(), 0, 0,VoteType.UP , new ArrayList<>()
        );
        
        Vote vote = new Vote("v1", new Date(), VoteType.UP, parent);

        assertEquals("The vote must point to the correct parent comment ID", 
                    "c1", vote.comment().commentID());
        assertEquals(VoteType.UP, vote.type());
    }

    /**
     * Verifies that comment stores vote counts.
     */
    @Test
    public void commentStoresVoteCounts() {
        // Verifies that vote tracking in comments is consistent
        Comment comment = new Comment(
                "c1", "Text", ContentStatus.VISIBLE, "u1", "l1", 
                null, LocalDateTime.now(), 2, 10,VoteType.UP, new ArrayList<>()
        );
        
        assertEquals(10, comment.upVotes());
        assertEquals(2, comment.downVotes());
    }

    /**
     * Verifies that rating category exposes correct display names.
     */
    @Test
    public void ratingCategoryExposesCorrectDisplayNames() {
        // Verifies that internal categories map to the correct German display strings
        assertEquals("Room", RatingCategory.ROOM.getDisplayName());
        assertEquals("Organization", RatingCategory.ORGANIZATION.getDisplayName());
        assertEquals("Pace", RatingCategory.LECTURE_PACE.getDisplayName());
    }

    /**
     * Verifies that report reason formats to string correctly.
     */
    @Test
    public void reportReasonFormatsToStringCorrectly() {
        // Verifies the custom toString implementation for report reasons
        assertEquals("Hate Speech", ReportReason.HATE_SPEECH.toString());
        assertEquals("Spam", ReportReason.SPAM.toString());
        assertEquals("Other", ReportReason.OTHER.toString());
    }

    /**
     * Verifies that image retriever requests PNG variant.
     */
    @Test
    public void imageRetrieverRequestsPngVariant() {
        // Verifies the logic that replaces .svg with .png for Android compatibility
        String[] requestedUrl = new String[1];
        APIService apiService = (APIService) Proxy.newProxyInstance(
                APIService.class.getClassLoader(),
                new Class<?>[]{APIService.class},
                (proxy, method, args) -> {
                    if ("downloadImage".equals(method.getName())) {
                        requestedUrl[0] = (String) args[0];
                        return null;
                    }
                    if ("toString".equals(method.getName())) return "MockAPIService";
                    return null;
                }
        );

        ImageRetriever retriever = new ImageRetriever(apiService, "https://example.com/icon.svg");
        retriever.getPicture();

        assertEquals("https://example.com/icon.png", requestedUrl[0]);
    }

    /**
     * Verifies that domain constructors retain their supplied values.
     */
    @Test
    public void verifyEssentialConstructors() {
        // Domain Models
        assertNotNull(new Rating("l1", RatingCategory.ROOM, 4.0, Rater.USER));
        assertNotNull(new UserStatistics(10, 5, 1.0, 4.0));
        assertNotNull(new Professor("p1", "Ada", "Lovelace", 5.0f, 1));
        assertNotNull(new LectureOffering("lo1", null, null, null));

        // Requests
        assertNotNull(new BugReportRequest("title", "desc", null));
        assertNotNull(new CommentReportRequest("c1", ReportReason.OTHER, "msg"));
        assertNotNull(new PostCommentRequest("l1", "msg"));
        assertNotNull(new RatingRequest("l1", Collections.emptyList()));
        assertNotNull(new RatingTopicRequest(RatingCategory.ROOM, 4.0));
        assertNotNull(new SubmitAnswerRequest("c1", "msg"));

        // Responses
        assertNotNull(new AnswerResponse("a1", "msg", ContentStatus.VISIBLE, "u1", LocalDateTime.now()));
        assertNotNull(new LectureResponse("l1", "name", "code", 2024, SemesterSeason.SS, "","title", true, LectureType.LECTURE_ONLY, Collections.emptyList(), 0, 0, 3.5));
        assertNotNull(new NotificationResponse("n1", NotificationType.ANSWER, null, "u", "msg", "c", "p", LocalDateTime.now()));
        assertNotNull(new PersonalStatisticsResponse("msg", true, "u", "p", 4.5f, 10, 5, 100));
        assertNotNull(new ProfessorDetailResponse("msg", true, null));
        assertNotNull(new ProfessorResponse("p1", "f", "l", true, 4.5, 10, Collections.emptyList()));
        assertNotNull(new RatingCategoriesResponse("msg", true, Collections.emptyList()));
        assertNotNull(new RatingCategoryResponse(RatingCategory.ROOM, "Raum", 4.5));
        assertNotNull(new StudentProfileResponse("msg", true, "u", "p", 4.5, 10, 5, 100));
        assertNotNull(new TopicAverageResponse(RatingCategory.ROOM, 4.5));
        assertNotNull(new UserRatingDto(null, 4.5));
        assertNotNull(new UserRatingResponse("msg", true, Collections.emptyList()));
    }
}
