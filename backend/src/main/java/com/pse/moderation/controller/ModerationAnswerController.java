package com.pse.moderation.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.request.ContentUpdateRequest;
import com.pse.moderation.dto.request.UpdateStatusRequest;
import com.pse.moderation.dto.response.ManagedAnswersResponse;
import com.pse.moderation.dto.response.ReportedAnswersResponse;
import com.pse.moderation.service.ModerationAnswerReportService;
import com.pse.moderation.service.ModerationContentService;
import com.pse.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping({"/admin/answers", "/answers"})
public class ModerationAnswerController {

    private final ModerationContentService contentService;
    private final ModerationAnswerReportService reportService;

    public ModerationAnswerController(
            ModerationContentService contentService,
            ModerationAnswerReportService reportService
    ) {
        this.contentService = contentService;
        this.reportService = reportService;
    }

    @GetMapping
    public ManagedAnswersResponse getAnswers() {
        return contentService.getAnswers();
    }

    @GetMapping("/reported")
    public ReportedAnswersResponse getReportedAnswers() {
        return reportService.getReportedAnswers();
    }

    @PatchMapping("/reported/{id}")
    public BasicResponse updateReportStatus(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request
    ) {
        return reportService.updateReportStatus(principal, id, request.status());
    }

    @DeleteMapping("/reported/{id}")
    public BasicResponse deleteReport(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return reportService.deleteReport(principal, id);
    }

    @PatchMapping("/{id}")
    public BasicResponse updateAnswer(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @RequestBody ContentUpdateRequest request
    ) {
        return contentService.updateAnswer(principal, id, request);
    }

    @DeleteMapping("/{id}")
    public BasicResponse deleteAnswer(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return contentService.deleteAnswer(principal, id);
    }
}
