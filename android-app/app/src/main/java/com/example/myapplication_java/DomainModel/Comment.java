package com.example.myapplication_java.DomainModel;

import com.example.myapplication_java.ServerCommunication.ContentStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A comment a student wrote about a lecture offering.
 *
 * <p>Comments are one level deep: a top level comment carries its answers in
 * {@link #answers()}, and those answers have no answers of their own.</p>
 *
 * @param commentID       unique id of the comment
 * @param content         the text the student wrote
 * @param status          whether the comment is visible, hidden or deleted
 * @param studentUsername the anonymised name shown next to the comment
 * @param lectureID       id of the lecture offering the comment belongs to
 * @param createdAt       when the comment was written
 * @param answers         the answers to this comment, empty when there are none
 */
public record Comment (
        String commentID,
        String content,
        ContentStatus status,
        String studentUsername,
        String lectureID,
        LocalDateTime createdAt,
        int downVotes,
        int upVotes,
        List<Comment> answers
) {}
