package com.example.ratemyprofessor.domain;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.Entity;

import androidx.room.Index;
import androidx.room.PrimaryKey;

import com.example.ratemyprofessor.servercommunication.ContentStatus;

import java.time.LocalDateTime;

/**
 * Stores a comment or reply and its moderation and voting data in the local database.
 *
 * @param commentID the identifier of the comment
 * @param parentID the parent comment identifier, or null for a top-level comment
 * @param content the text content
 * @param status the moderation status of the comment
 * @param studentUsername the username of the comment author
 * @param lectureID the identifier of the lecture offering
 * @param createdAt the time the entry was created
 * @param downVotes the number of downvotes
 * @param upVotes the number of upvotes
 */
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
