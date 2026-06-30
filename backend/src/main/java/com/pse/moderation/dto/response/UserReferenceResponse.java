package com.pse.moderation.dto.response;

import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;

import java.util.UUID;

public record UserReferenceResponse(

        UUID id,
        String name,
        UserRole role,
        int warnings,
        UserStatus status
) {
}
