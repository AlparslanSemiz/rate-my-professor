package com.example.ratemyprofessor.domain;

/**
 * The direction of a {@link Vote}.
 */
public enum VoteType {

    /**
     * The user agrees with the comment.
     */
    UP,

    /**
     * The user disagrees with the comment.
     */
    DOWN,

    /**
     * The user has not (yet) voted a comment
     */
    NONE
}
