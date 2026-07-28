package com.example.myapplication_java.ServerCommunication;

/**
 * Body for answering an existing comment.
 *
 * @param commentId the id of the comment that is being answered
 * @param content   the text the user wrote
 */
public record SubmitAnswerRequest(
    String commentId,
    String content
) {}
