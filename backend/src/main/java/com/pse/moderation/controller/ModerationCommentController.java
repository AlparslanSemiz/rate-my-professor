package com.pse.moderation.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.request.UpdateStatusRequest;
import com.pse.moderation.dto.response.ReportedCommentsResponse;
import com.pse.moderation.service.ModerationCommentService;
import com.pse.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/comments")
public class ModerationCommentController {

    private final ModerationCommentService service;

    public ModerationCommentController(ModerationCommentService service) {
        this.service = service;
    }

    @GetMapping("/reported")
    public ReportedCommentsResponse getReportedComments() {
        return service.getReportedComments();
    }

    @PatchMapping("/reported/{id}")
    public BasicResponse updateReportStatus(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request
    ) {
        return service.updateReportStatus(principal, id, request.status());
    }
}
