package com.example.ratemyprofessor.domain;

/**
 * Distinguishes top-level comments from replies.
 */
public enum CommentType {
    /**
     * A top-level comment.
     */
    COMMENT,
    /**
     * A reply to a comment.
     */
    REPLY
}
