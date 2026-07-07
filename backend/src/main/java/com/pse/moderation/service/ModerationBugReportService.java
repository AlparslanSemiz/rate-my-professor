package com.pse.moderation.service;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.moderation.dto.request.BugReportRequest;
import com.pse.moderation.dto.request.UpdateStatusRequest;
import com.pse.moderation.dto.response.BugReportResponse;
import com.pse.moderation.dto.response.BugReportsResponse;
import com.pse.moderation.model.BugReport;
import com.pse.moderation.repository.BugReportRepository;
import com.pse.shared.enums.ReportStatus;
import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ModerationBugReportService {


    @Autowired
    private ModerationUserService moderationUserService;
    @Autowired
    private BugReportRepository bugReportRepository;

    @Autowired
    private AuthService authService;


    public BugReportsResponse getAllReports(String authHeader) {

        if(!moderationUserService.validateAdminToken(authHeader)) {
            return null;
        }

        List<BugReport> reports = bugReportRepository.findAll();
        List<BugReportResponse> responses = new ArrayList<>();

        for (BugReport report : reports) {
            responses.add(new BugReportResponse(
                    report.getId(),
                    report.getTitle(),
                    report.getDescription(),
                    report.getSeverity(),
                    report.getStatus(),
                    report.getReporter().getUsername(),
                    report.getCreatedAt()
            ));
        }


        return new BugReportsResponse("Successfully found all entries", true, responses);

    }

    public BasicResponse updateBugReportStatus(String authHeader, UUID report_id, ReportStatus status) {

        if(!moderationUserService.validateAdminToken(authHeader)) {
            return null;
        }

        BugReport bugReport = bugReportRepository.findById(report_id).orElse(null);
        if (bugReport == null) {
            return new BasicResponse("Error, couldnt find BugReport", false);
        }

        bugReport.setStatus(status);
        bugReportRepository.save(bugReport);
        return new BasicResponse("Successfully updated BugReport", true);
    }

    public BasicResponse sendBugReport(String authHeader, BugReportRequest request) {


        Student student = authService.verifyUser(authHeader);

        if(student == null) {
            return new BasicResponse("Error, couldnt find Student", false);
        }

        BugReport bugReport = new BugReport();
        bugReport.setTitle(request.title());
        bugReport.setDescription(request.description());
        bugReport.setSeverity(request.severity());
        bugReport.setReporter(student);


        bugReportRepository.save(bugReport);

        return new BasicResponse("Successfully sent BugReport", true);

    }
}
