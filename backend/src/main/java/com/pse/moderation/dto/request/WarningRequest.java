package com.pse.moderation.dto.request;

import com.pse.moderation.model.Admin;

import java.time.LocalDateTime;
import java.util.UUID;

public record WarningRequest (

    UUID id,
    UUID userID,
    String message,
    LocalDateTime createdAt,
    Admin createdFrom

    )
{}


