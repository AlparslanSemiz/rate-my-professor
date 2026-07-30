package com.example.myapplication_java.DomainModel;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Index;
import androidx.room.PrimaryKey;

import com.example.myapplication_java.ServerCommunication.ContentStatus;

import java.time.LocalDateTime;
import java.util.List;

@Entity(
        tableName = "comments",
        foreignKeys = @ForeignKey(
                entity = CommentModel.class,
                parentColumns = "commentID",
                childColumns = "parentID",
                onDelete = ForeignKey.CASCADE
        ),
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
