package com.pse.user.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.pse.moderation.model.Warning;
import com.pse.rating.model.Rating;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerReport;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentReport;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.pse.shared.enums.UserStatus;

import jakarta.persistence.*;
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
    private int credibilityScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(columnDefinition = "TEXT")
    private String biography;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "blocked_at")
    private LocalDateTime blockedAt;

    @Column(name = "blocked_reason")
    private String blockedReason;

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

    @OneToMany(mappedBy = "student")
    private List<Warning> warnings = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}