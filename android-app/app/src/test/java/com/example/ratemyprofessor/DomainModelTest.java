package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.example.ratemyprofessor.DomainModel.Comment;
import com.example.ratemyprofessor.DomainModel.Notification;
import com.example.ratemyprofessor.DomainModel.RatingCategory;
import com.example.ratemyprofessor.DomainModel.Semester;
import com.example.ratemyprofessor.DomainModel.SemesterSeason;
import com.example.ratemyprofessor.DomainModel.Vote;
import com.example.ratemyprofessor.DomainModel.VoteType;
import com.example.ratemyprofessor.ServerCommunication.APIService;
import com.example.ratemyprofessor.ServerCommunication.ContentStatus;
import com.example.ratemyprofessor.ServerCommunication.ImageRetriever;
import com.example.ratemyprofessor.ServerCommunication.ReportReason;

import org.junit.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;

/**
 * Tests logic and state transitions within the domain model.
 */
public class DomainModelTest {

    @Test
    public void semesterFormatsDisplayNameCorrectly() {
        // This tests actual logic in Semester.java
        Semester winter = new Semester(2026, SemesterSeason.WS);
        Semester summer = new Semester(2025, SemesterSeason.SS);

        assertEquals("WS2026", winter.getSemesterName());
        assertEquals("SS2025", summer.getSemesterName());
    }

    @Test
    public void notificationStateChangesWhenMarkedAsRead() {
        // Tests state transition logic in Notification.java
        Notification notification = new Notification("id-1", "Msg", new Date(), false);
        
        assertFalse("Notification should start as unread", notification.isRead);
        
        notification.markAsRead();
        
        assertTrue("Notification should be read after markAsRead()", notification.isRead);
    }

    @Test
    public void voteCorrectlyLinksToParentComment() {
        // Verifies data integrity across related domain objects
        Comment parent = new Comment(
                "c1", "Great!", ContentStatus.VISIBLE, "user", "l1", 
                null, LocalDateTime.now(), 0, 0, new ArrayList<>()
        );
        
        Vote vote = new Vote("v1", new Date(), VoteType.UP, parent);

        assertEquals("The vote must point to the correct parent comment ID", 
                    "c1", vote.comment().commentID());
        assertEquals(VoteType.UP, vote.type());
    }

    @Test
    public void commentStoresVoteCounts() {
        // Verifies that vote tracking in comments is consistent
        Comment comment = new Comment(
                "c1", "Text", ContentStatus.VISIBLE, "u1", "l1", 
                null, LocalDateTime.now(), 2, 10, new ArrayList<>()
        );
        
        assertEquals(10, comment.upVotes());
        assertEquals(2, comment.downVotes());
    }

    @Test
    public void ratingCategoryExposesCorrectDisplayNames() {
        // Verifies that internal categories map to the correct German display strings
        assertEquals("Raum", RatingCategory.ROOM.getDisplayName());
        assertEquals("Organisation", RatingCategory.ORGANIZATION.getDisplayName());
        assertEquals("Tempo", RatingCategory.LECTURE_PACE.getDisplayName());
    }

    @Test
    public void reportReasonFormatsToStringCorrectly() {
        // Verifies the custom toString implementation for report reasons
        assertEquals("Hate Speech", ReportReason.HATE_SPEECH.toString());
        assertEquals("Spam", ReportReason.SPAM.toString());
        assertEquals("Other", ReportReason.OTHER.toString());
    }

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
}
