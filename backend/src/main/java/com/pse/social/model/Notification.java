package com.pse.social.model;


import com.pse.user.model.Student;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "recipient_id")
    private Student recipient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "answer_id")
    private Answer answer;

    @Column(nullable = false)
    private boolean seen;


    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
