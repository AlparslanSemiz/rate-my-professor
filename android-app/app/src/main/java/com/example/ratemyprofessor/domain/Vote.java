package com.example.ratemyprofessor.domain;

import java.util.Date;

/**
 * An up- or downvote a user cast on a comment.
 *
 * <p>Each user can vote at most once per comment; changing the mind replaces the existing
 * vote instead of adding a second one.</p>
 *
 * @param voteId    unique id of the vote
 * @param createdAt when the vote was cast
 * @param type      whether it is an upvote or a downvote
 * @param comment   the comment that was voted on
 */
public record Vote (
    String voteId,
    Date createdAt,
    VoteType type,
    Comment comment

) {}
