package com.pse.moderation.dto.response;

import com.pse.user.dto.StudentProfileResponse;

import java.util.List;

public record UserListResponse(
        String message,
        boolean success,
        List<UserResponse> users
) {
}
