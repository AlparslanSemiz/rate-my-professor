package com.example.myapplication_java;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertSame;

import com.example.myapplication_java.DomainModel.Comment;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Rating;
import com.example.myapplication_java.DomainModel.RatingCategory;
import com.example.myapplication_java.DomainModel.Review;
import com.example.myapplication_java.DomainModel.User;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.ServerResponse;

import org.junit.Test;

import java.util.Date;

public class DomainModelTest {
    @Test
    public void professorConstructorStoresImplementedFields() {
        Professor professor = new Professor(
                "prof-1",
                "Ada",
                "Lovelace",
                "Informatik",
                4.5f
        );

        assertEquals("prof-1", professor.id);
        assertEquals("Ada", professor.firstName);
        assertEquals("Lovelace", professor.lastName);
        assertEquals("Informatik", professor.department);
        assertEquals(4.5f, professor.averageRating, 0.001f);
    }

    @Test
    public void lectureConstructorStoresImplementedFields() {
        Lecture lecture = new Lecture("lecture-1", "Algorithms", "240001");

        assertEquals("lecture-1", lecture.id);
        assertEquals("Algorithms", lecture.name);
        assertEquals("240001", lecture.code);
    }

    @Test
    public void ratingConstructorStoresImplementedFields() {
        RatingCategory category = new RatingCategory(
                "category-1",
                "Clarity",
                "How clearly the material is explained"
        );

        Rating rating = new Rating("rating-1", 5, category);

        assertEquals("rating-1", rating.ratingId);
        assertEquals(5, rating.value);
        assertEquals(category, rating.ratingCategory);
        assertNotNull(rating.ratingCategory);
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
}
