package com.pse.moderation.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.request.UpdateStatusRequest;
import com.pse.moderation.dto.response.BugReportsResponse;
import com.pse.moderation.service.ModerationBugReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/reports")
public class ModerationBugReportController {


    @Autowired
    private ModerationBugReportService moderationBugReportService;


    @GetMapping
    public BugReportsResponse getAllReports(@RequestHeader("Authorization") String authHeader) {

        return moderationBugReportService.getAllReports(authHeader);

    }

    //TODO: path Variable
    @PatchMapping("/{report_id}")
    public BasicResponse updateBugReportStatus(@RequestHeader("Authorization") String authHeader, @RequestBody UpdateStatusRequest request, @PathVariable UUID report_id) {
        return moderationBugReportService.updateBugReportStatus(authHeader, report_id, request.status());
    }
}
