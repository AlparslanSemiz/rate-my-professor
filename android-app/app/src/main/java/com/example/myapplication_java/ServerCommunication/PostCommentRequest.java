package com.example.myapplication_java.ServerCommunication;

/**
 * Body for posting a new comment on a lecture offering.
 *
 * @param lectureID the id of the lecture offering the comment belongs to
 * @param content   the text the user wrote
 */
public record PostCommentRequest (
    String lectureID,
    String content
) {}
