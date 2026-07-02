package com.pse.moderation.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.request.UpdateStatusRequest;
import com.pse.moderation.dto.response.ReportedCommentsResponse;
import com.pse.moderation.service.ModerationCommentService;

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
@RequestMapping("/comments")
public class ModerationCommentController {


    @Autowired
    private ModerationCommentService moderationCommentService;


    @GetMapping("/reported")
    public ReportedCommentsResponse getReportedComments(@RequestHeader("Authorization") String authHeader) {

        return moderationCommentService.getReportedComments(authHeader);

    }


    @PatchMapping("/reported/{report_id}")
    public BasicResponse updateReportStatus(@RequestHeader("Authorization") String authHeader, @PathVariable UUID report_id, @RequestBody UpdateStatusRequest request) {

        return moderationCommentService.updateReportStatus(authHeader, report_id, request.status());

    }
}