package com.pse.moderation.service;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.moderation.dto.request.BugReportRequest;
import com.pse.moderation.dto.request.BugReportUpdateRequest;
import com.pse.moderation.dto.response.BugReportResponse;
import com.pse.moderation.dto.response.BugReportsResponse;
import com.pse.moderation.model.BugReport;
import com.pse.moderation.repository.BugReportRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.error.ApiException;
import com.pse.shared.util.UtcDates;
import com.pse.user.model.Student;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ModerationBugReportService {

    private final BugReportRepository repository;
    private final AuthService authService;
    private final AuditWriter auditWriter;

    public ModerationBugReportService(
            BugReportRepository repository,
            AuthService authService,
            AuditWriter auditWriter
    ) {
        this.repository = repository;
        this.authService = authService;
        this.auditWriter = auditWriter;
    }

    @Transactional(readOnly = true)
    public BugReportsResponse getAllReports() {
        List<BugReportResponse> reports = repository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
        return new BugReportsResponse("Successfully found all entries", true, reports);
    }

    @Transactional
    public BasicResponse updateBugReport(
            AuthenticatedUser principal,
            UUID reportId,
            BugReportUpdateRequest request
    ) {
        if (request == null || (request.status() == null && request.severity() == null)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No update supplied");
        }

        BugReport report = repository.findByIdForUpdate(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bug report not found"));
        Map<String, Object> changes = new LinkedHashMap<>();

        if (request.status() != null && report.getStatus() != request.status()) {
            changes.put("status", change(report.getStatus().name(), request.status().name()));
            report.setStatus(request.status());
        }
        if (request.severity() != null && report.getSeverity() != request.severity()) {
            changes.put("severity", change(report.getSeverity().name(), request.severity().name()));
            report.setSeverity(request.severity());
        }
        if (changes.isEmpty()) {
            return new BasicResponse("Updated", true);
        }

        repository.save(report);
        auditWriter.write(
                principal.admin(),
                AuditAction.BUG_REPORT_UPDATED,
                AuditTargetType.BUG_REPORT,
                report.getId(),
                report.getTitle(),
                changes,
                Map.of()
        );
        return new BasicResponse("Updated", true);
    }

    @Transactional
    public BasicResponse sendBugReport(String authHeader, BugReportRequest request) {
        Student student = authService.verifyUser(authHeader);
        if (student == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        if (request == null
                || request.title() == null
                || request.title().isBlank()
                || request.description() == null
                || request.description().isBlank()
                || request.severity() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid bug report");
        }

        BugReport report = new BugReport();
        report.setTitle(request.title().trim());
        report.setDescription(request.description().trim());
        report.setSeverity(request.severity());
        report.setReporter(student);
        repository.save(report);
        return new BasicResponse("Successfully sent BugReport", true);
    }

    private BugReportResponse toResponse(BugReport report) {
        return new BugReportResponse(
                report.getId(),
                report.getTitle(),
                report.getDescription(),
                report.getSeverity(),
                report.getStatus(),
                report.getReporter() == null ? "Unknown" : report.getReporter().getUsername(),
                UtcDates.format(report.getCreatedAt())
        );
    }

    private Map<String, Object> change(Object before, Object after) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("before", before);
        value.put("after", after);
        return value;
    }
}
