package com.pse.moderation.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.request.BugReportRequest;
import com.pse.moderation.dto.request.BugReportUpdateRequest;
import com.pse.moderation.dto.response.BugReportsResponse;
import com.pse.moderation.service.ModerationBugReportService;
import com.pse.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/reports")
public class ModerationBugReportController {

    private final ModerationBugReportService service;

    public ModerationBugReportController(ModerationBugReportService service) {
        this.service = service;
    }

    @GetMapping
    public BugReportsResponse getAllReports() {
        return service.getAllReports();
    }

    @PatchMapping("/{id}")
    public BasicResponse updateBugReport(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @RequestBody BugReportUpdateRequest request
    ) {
        return service.updateBugReport(principal, id, request);
    }

    @PostMapping
    public BasicResponse sendBugReport(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody BugReportRequest request
    ) {
        return service.sendBugReport(authHeader, request);
    }
}
