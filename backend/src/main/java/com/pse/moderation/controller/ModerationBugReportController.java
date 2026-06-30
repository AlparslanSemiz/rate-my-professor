package com.pse.moderation.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.TokenService;
import com.pse.moderation.dto.response.BugReportsResponse;
import com.pse.moderation.service.ModerationBugReportService;
import com.pse.moderation.service.ModerationService;
import com.pse.shared.enums.ReportStatus;
import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/reports")
public class ModerationBugReportController {

    @Autowired
    private ModerationService moderationService;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private ModerationBugReportService moderationBugReportService;



    private boolean validateAdminToken(String authHeader) {

        Student student = tokenService.verifyUser(authHeader);

        return student != null && moderationService.verifyAdmin(student);

    }


    @GetMapping
    public BugReportsResponse getAllReports(@RequestHeader("Authorization") String authHeader) {

        if(validateAdminToken(authHeader)) {
            return null;
        }

        return moderationBugReportService.getAllReports();
    }

    //TODO: path Variable
    @PatchMapping("/{report_id}")
    public BasicResponse updateBugReportStatus(@RequestHeader("Authorization") String authHeader, ReportStatus status, @PathVariable UUID report_id) {

        if(validateAdminToken(authHeader)) {
            return null;
        }

        return moderationBugReportService.updateBugReportStatus(report_id, status);
    }
}
