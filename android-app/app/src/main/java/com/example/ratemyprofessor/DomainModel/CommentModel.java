package com.example.ratemyprofessor.DomainModel;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.Entity;

import androidx.room.Index;
import androidx.room.PrimaryKey;

import com.example.ratemyprofessor.ServerCommunication.ContentStatus;

import java.time.LocalDateTime;

@Entity(
        tableName = "comments",
//        foreignKeys = @ForeignKey(
//                entity = CommentModel.class,
//                parentColumns = "commentID",
//                childColumns = "parentID"
//        ),
        indices = @Index("parentID")
)
public record CommentModel (
        @NonNull
        @PrimaryKey
        String commentID,
        @Nullable
        String parentID,
        String content,
        ContentStatus status,
        String studentUsername,
        String lectureID,
        LocalDateTime createdAt,
        int downVotes,
        int upVotes
) {}
