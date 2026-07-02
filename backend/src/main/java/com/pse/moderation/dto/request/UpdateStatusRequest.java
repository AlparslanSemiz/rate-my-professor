package com.pse.moderation.dto.request;

import com.pse.shared.enums.ReportStatus;

public record UpdateStatusRequest(
        ReportStatus status
) {
}
