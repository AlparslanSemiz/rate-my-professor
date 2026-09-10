package com.example.ratemyprofessor.servercommunication.responses;

import com.example.ratemyprofessor.domain.Comment;

import java.util.List;

/**
 * Answer holding all comments of one lecture offering.
 *
 * @param message  a human-readable explanation, mostly relevant when the request failed
 * @param success  whether the comments could be loaded
 * @param comments the top level comments; their answers are nested inside them
 */
public record CommentsResponse (
    String message,
    boolean success,
    List<Comment> comments
) {}
