package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.example.ratemyprofessor.DomainModel.Comment;
import com.example.ratemyprofessor.DomainModel.Lecture;
import com.example.ratemyprofessor.DomainModel.LectureOffering;
import com.example.ratemyprofessor.DomainModel.Professor;
import com.example.ratemyprofessor.DomainModel.Rater;
import com.example.ratemyprofessor.DomainModel.Rating;
import com.example.ratemyprofessor.DomainModel.RatingCategory;
import com.example.ratemyprofessor.DomainModel.RatingTopic;
import com.example.ratemyprofessor.DomainModel.Semester;
import com.example.ratemyprofessor.DomainModel.SemesterSeason;
import com.example.ratemyprofessor.DomainModel.User;
import com.example.ratemyprofessor.DomainModel.UserStatistics;
import com.example.ratemyprofessor.DomainModel.Vote;
import com.example.ratemyprofessor.DomainModel.VoteType;
import com.example.ratemyprofessor.ServerCommunication.ContentStatus;

import org.junit.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;

public class DomainModelTest {

    @Test
    public void professorConstructorStoresFields() {
        Professor professor = new Professor(
                "prof-1",
                "Ada",
                "Lovelace",
                4.5f,
                10
        );

        assertEquals("prof-1", professor.id);
        assertEquals("Ada", professor.firstName);
        assertEquals("Lovelace", professor.lastName);
        assertEquals(4.5f, professor.averageRating, 0.001f);
        assertEquals(10, professor.ratingCount);
    }

    @Test
    public void lectureConstructorStoresFields() {
        Lecture lecture = new Lecture(
                "lecture-1",
                "Algorithms",
                "240001",
                2026,
                SemesterSeason.WS,
                true,
                5,
                10
        );

        assertEquals("lecture-1", lecture.id);
        assertEquals("Algorithms", lecture.name);
        assertEquals("240001", lecture.code);
        assertEquals(2026, lecture.semesterYear);
        assertEquals(SemesterSeason.WS, lecture.semesterSeason);
        assertTrue(lecture.active);
        assertEquals(5, lecture.commentCount);
        assertEquals(10, lecture.ratingCount);
    }

    @Test
    public void semesterConstructorStoresFields() {
        Semester semester = new Semester(2026, SemesterSeason.SS);
        assertEquals(2026, semester.semesterYear());
        assertEquals(SemesterSeason.SS, semester.semesterSeason());
    }

    @Test
    public void ratingTopicConstructorStoresFields() {
        RatingTopic topic = new RatingTopic("Clarity", 5);
        assertEquals("Clarity", topic.name());
        assertEquals(5, topic.value());
    }

    @Test
    public void ratingConstructorStoresFields() {
        Rating rating = new Rating("l1", RatingCategory.ROOM, 4.5, Rater.USER);
        assertEquals("l1", rating.lectureID);
        assertEquals(RatingCategory.ROOM, rating.category);
        assertEquals(4.5, rating.score, 0.001);
        assertEquals(Rater.USER, rating.rater);
    }

    @Test
    public void userConstructorStoresFields() {
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
    public void userStatisticsConstructorStoresFields() {
        UserStatistics statistics = new UserStatistics(3, 7, 2.5, 4.1);

        assertEquals(3, statistics.reviewCount);
        assertEquals(7, statistics.commentCount);
        assertEquals(2.5, statistics.upvoteDownvoteRatio, 0.001);
        assertEquals(4.1, statistics.averageGivenGrade, 0.001);
    }

    @Test
    public void voteConstructorStoresFields() {
        Date now = new Date();
        Comment comment = new Comment(
                "001",
                "Great lecture!",
                ContentStatus.VISIBLE,
                "user123",
                "lecture-1",
                null,
                LocalDateTime.now(),
                0, 0,
                new ArrayList<>()
        );
        Vote vote = new Vote("vote-1", now, VoteType.UP, comment);

        assertEquals("vote-1", vote.voteId());
        assertEquals(now, vote.createdAt());
        assertEquals(VoteType.UP, vote.type());
        assertEquals(comment, vote.comment());
    }

    @Test
    public void lectureOfferingConstructorStoresFields() {
        Lecture lecture = new Lecture("l1", "Algorithms", "c1", 2026, SemesterSeason.WS, true,  0, 0);
        Professor professor = new Professor("p1", "Ada", "Lovelace", 5.0f, 10);
        Semester semester = new Semester(2026, SemesterSeason.WS);
        
        LectureOffering offering = new LectureOffering("offering-1", lecture, professor, semester);

        assertEquals("offering-1", offering.offeringId());
        assertEquals(lecture, offering.lecture());
        assertEquals(professor, offering.professor());
        assertEquals(semester, offering.semester());
    }
}
