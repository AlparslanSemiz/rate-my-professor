package com.pse.social.model;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.pse.user.model.Student;
import com.pse.shared.enums.ReportStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "comment_reports",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"reporter_id", "comment_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
public class CommentReport {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.OPEN;

    @ManyToOne(optional = false)
    @JoinColumn(name = "reporter_id")
    private Student reporter;

    @ManyToOne(optional = false)
    @JoinColumn(name = "comment_id")
    private Comment comment;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}