package com.example.ratemyprofessor.ServerCommunication.Responses;

import com.example.ratemyprofessor.ServerCommunication.ContentStatus;

import java.time.LocalDateTime;

/**
 * A single answer to a comment as the server sends it.
 *
 * <p>Unlike a comment, an answer cannot be answered itself, which is why it carries no
 * nested list of its own.</p>
 *
 * @param commentId       the id of the answer
 * @param content         the text the user wrote
 * @param status          whether the answer is visible, hidden or deleted
 * @param studentUsername the anonymised name shown next to the answer
 * @param createdAt       when the answer was written
 */
public record AnswerResponse (
    String commentId,
    String content,
    ContentStatus status,
    String studentUsername,
    LocalDateTime createdAt
) {}
