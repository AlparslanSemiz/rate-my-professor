package com.example.myapplication_java;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.example.myapplication_java.DomainModel.Comment;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.LectureOffering;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Rating;
import com.example.myapplication_java.DomainModel.RatingTopic;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.DomainModel.SemesterSeason;
import com.example.myapplication_java.DomainModel.User;
import com.example.myapplication_java.DomainModel.UserStatistics;
import com.example.myapplication_java.DomainModel.Vote;
import com.example.myapplication_java.DomainModel.VoteType;

import org.junit.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
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
                SemesterSeason.WINTER,
                true,
                "prof-1",
                5,
                10
        );

        assertEquals("lecture-1", lecture.id);
        assertEquals("Algorithms", lecture.name);
        assertEquals("240001", lecture.code);
        assertEquals(2026, lecture.semesterYear);
        assertEquals(SemesterSeason.WINTER, lecture.semesterSeason);
        assertTrue(lecture.active);
        assertEquals("prof-1", lecture.professorId);
        assertEquals(5, lecture.commentCount);
        assertEquals(10, lecture.ratingCount);
    }

    @Test
    public void semesterConstructorStoresFields() {
        Semester semester = new Semester(2026, SemesterSeason.SUMMER);
        assertEquals(2026, semester.semesterYear);
        assertEquals(SemesterSeason.SUMMER, semester.semesterSeason);
    }

    @Test
    public void ratingTopicConstructorStoresFields() {
        RatingTopic topic = new RatingTopic("Clarity", 5);
        assertEquals("Clarity", topic.name);
        assertEquals(5, topic.value);
    }

    @Test
    public void ratingConstructorStoresFields() {
        RatingTopic topic = new RatingTopic("Clarity", 5);
        Rating rating = new Rating("lecture-1", Collections.singletonList(topic));
        assertEquals("lecture-1", rating.lectureId);
        assertEquals(1, rating.topics.size());
        assertEquals(topic, rating.topics.get(0));
    }

    @Test
    public void commentFieldsAreAccessible() {
        LocalDateTime now = LocalDateTime.now();
        Comment comment = new Comment();
        comment.content = "Great lecture!";
        comment.studentUsername = "user123";
        comment.lectureID = "lecture-1";
        comment.createdAt = now;
        comment.answers = new ArrayList<>();

        assertEquals("Great lecture!", comment.content);
        assertEquals("user123", comment.studentUsername);
        assertEquals("lecture-1", comment.lectureID);
        assertEquals(now, comment.createdAt);
        assertNotNull(comment.answers);
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
        Comment comment = new Comment();
        Vote vote = new Vote("vote-1", now, VoteType.UPVOTE, comment);

        assertEquals("vote-1", vote.voteId);
        assertEquals(now, vote.createdAt);
        assertEquals(VoteType.UPVOTE, vote.type);
        assertEquals(comment, vote.comment);
    }

    @Test
    public void lectureOfferingConstructorStoresFields() {
        Lecture lecture = new Lecture("l1", "Algorithms", "c1", 2026, SemesterSeason.WINTER, true, "p1", 0, 0);
        Professor professor = new Professor("p1", "Ada", "Lovelace", 5.0f, 10);
        Semester semester = new Semester(2026, SemesterSeason.WINTER);
        
        LectureOffering offering = new LectureOffering("offering-1", lecture, professor, semester);

        assertEquals("offering-1", offering.offeringId);
        assertEquals(lecture, offering.lecture);
        assertEquals(professor, offering.professor);
        assertEquals(semester, offering.semester);
        assertEquals(5.0, offering.getAverageRating(), 0.001);
    }
}
