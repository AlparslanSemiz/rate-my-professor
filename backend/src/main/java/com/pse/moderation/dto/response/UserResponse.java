package com.pse.moderation.dto.response;

import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String kitEmail,
        UserRole role,
        UserStatus status,
        String joined,
        String lastOnline,

        String biography,
        int warnings,
        int reports
) {}
