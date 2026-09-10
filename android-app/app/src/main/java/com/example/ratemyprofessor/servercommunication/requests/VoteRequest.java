package com.example.ratemyprofessor.servercommunication.requests;

import com.example.ratemyprofessor.domain.VoteType;

public record VoteRequest(VoteType voteType) {
}
