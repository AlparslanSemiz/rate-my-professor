package com.example.ratemyprofessor.ServerCommunication.Requests;

import com.example.ratemyprofessor.DomainModel.VoteType;

public record VoteRequest (VoteType voteType) {
}
