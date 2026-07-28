package com.pse.auth.dto.response;

import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;

import java.util.UUID;

public record AuthUserResponse(
        UUID id,
        String username,
        String kitEmail,
        UserRole role,
        UserStatus status
) {
}
