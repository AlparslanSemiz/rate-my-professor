package com.example.ratemyprofessor.ServerCommunication.Requests;

/**
 * Body for answering an existing comment.
 *
 * @param commentID the id of the comment that is being answered
 * @param content   the text the user wrote
 */
public record SubmitAnswerRequest(
    String commentID,
    String content
) {}
