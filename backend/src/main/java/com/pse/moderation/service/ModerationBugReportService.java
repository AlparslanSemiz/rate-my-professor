package com.pse.moderation.service;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.response.BugReportResponse;
import com.pse.moderation.dto.response.BugReportsResponse;
import com.pse.moderation.model.BugReport;
import com.pse.moderation.repository.BugReportRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.shared.enums.ReportStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ModerationBugReportService {

    @Autowired
    private BugReportRepository bugReportRepository;

    public BugReportsResponse getAllReports() {

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

    public BasicResponse updateBugReportStatus(UUID report_id, ReportStatus status) {
        BugReport bugReport = bugReportRepository.findById(report_id).orElse(null);
        if (bugReport == null) {
            return new BasicResponse("Error, couldnt find BugReport", false);
        }

        bugReport.setStatus(status);
        bugReportRepository.save(bugReport);
        return new BasicResponse("Successfully updated BugReport", true);
    }
}
