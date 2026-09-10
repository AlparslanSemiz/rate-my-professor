package com.example.ratemyprofessor.servercommunication.requests;

import com.example.ratemyprofessor.domain.VoteType;

/**
 * Contains the vote to submit for a comment or reply.
 *
 * @param voteType the vote associated with the comment
 */
public record VoteRequest(VoteType voteType) {
}
