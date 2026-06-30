package com.pse.moderation.dto.response;

import java.util.List;

public record WarningHistoryResponse(
        String message,
        boolean success,
        List<WarningResponse> warnings
) {
}
