package com.pse.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.pse.model.social.Answer;
import com.pse.model.social.AnswerReport;
import com.pse.model.social.Comment;
import com.pse.model.social.CommentReport;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
public class Student {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "kit_email", nullable = false, unique = true)
    private String kitEmail;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    @Column(name = "credibility_score", nullable = false)
    private int credibilityScore = 0;

    @OneToMany(mappedBy = "student")
    private List<Rating> ratings = new ArrayList<>();

    @OneToMany(mappedBy = "student")
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "student")
    private List<Answer> answers = new ArrayList<>();

    @OneToMany(mappedBy = "reporter")
    private List<CommentReport> commentReports = new ArrayList<>();

    @OneToMany(mappedBy = "reporter")
    private List<AnswerReport> answerReports = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}