package com.pse.moderation.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.TokenService;
import com.pse.moderation.dto.response.ReportedCommentsResponse;
import com.pse.moderation.service.ModerationCommentService;
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
@RequestMapping("/comments")
public class ModerationCommentController {


    @Autowired
    private ModerationService moderationService;
    @Autowired
    private ModerationCommentService moderationCommentService;
    @Autowired
    private TokenService tokenService;



    private boolean validateAdminToken(String authHeader) {

        Student student = tokenService.verifyUser(authHeader);

        return student != null && moderationService.verifyAdmin(student);

    }

    @GetMapping("/reported")
    public ReportedCommentsResponse getReportedComments(@RequestHeader("Authorization") String authHeader) {

        if(validateAdminToken(authHeader)) {
            return null;
        }

        return moderationCommentService.getReportedComments();

    }


    @PatchMapping("/reported/{report_id}")
    public BasicResponse updateReportStatus(@RequestHeader("Authorization") String authHeader, @PathVariable UUID report_id, ReportStatus status) {

        if(validateAdminToken(authHeader)) {
            return new BasicResponse("Couldnt authenticate Admin", false);
        }

        return moderationCommentService.updateReportStatus(report_id, status);

    }
}