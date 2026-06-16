package com.pse.model;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
    name = "rating_topics",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"rating_id", "name"})
    }
)
@Getter
@Setter
@NoArgsConstructor
public class RatingTopic {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private short value;

    @ManyToOne(optional = false)
    @JoinColumn(name = "rating_id")
    private Rating rating;
}