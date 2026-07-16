package com.example.myapplication_java.DomainModel;

import java.util.Date;

public record Vote (
    String voteId,
    Date createdAt,
    VoteType type,
    Comment comment

) {}
