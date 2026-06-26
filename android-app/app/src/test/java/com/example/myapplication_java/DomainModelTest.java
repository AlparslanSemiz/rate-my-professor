package com.example.myapplication_java;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Rating;
import com.example.myapplication_java.DomainModel.RatingCategory;

import org.junit.Test;

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
}
