package com.pse.moderation.model;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.pse.user.model.Student;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "admins",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "student_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Admin {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(optional = false)
    @JoinColumn(name = "student_id")
    private Student student;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
