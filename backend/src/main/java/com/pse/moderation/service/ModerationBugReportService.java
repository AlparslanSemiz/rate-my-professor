package com.pse.moderation.service;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.shared.dto.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.moderation.dto.request.BugReportRequest;
import com.pse.moderation.dto.request.BugReportUpdateRequest;
import com.pse.moderation.dto.response.BugReportResponse;
import com.pse.moderation.dto.response.BugReportsResponse;
import com.pse.moderation.dto.response.GitLabIssueResponse;
import com.pse.moderation.model.BugReport;
import com.pse.moderation.repository.BugReportRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.enums.ReportStatus;
import com.pse.shared.enums.IssueState;
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
    private final GitLabClient gitLabClient;
    private final BugReportIssueTransactions issueTransactions;

    public ModerationBugReportService(
            BugReportRepository repository,
            AuthService authService,
            AuditWriter auditWriter,
            GitLabClient gitLabClient,
            BugReportIssueTransactions issueTransactions
    ) {
        this.repository = repository;
        this.authService = authService;
        this.auditWriter = auditWriter;
        this.gitLabClient = gitLabClient;
        this.issueTransactions = issueTransactions;
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
        if (request == null
                || (request.status() == null
                && request.severity() == null
                && request.title() == null
                && request.description() == null)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No update supplied");
        }

        BugReport report = repository.findByIdForUpdate(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bug report not found"));
        Map<String, Object> changes = new LinkedHashMap<>();

        if (request.status() != null && report.getStatus() != request.status()) {
            changes.put("status", AuditWriter.value(report.getStatus().name(), request.status().name()));
            report.setStatus(request.status());
        }
        if (request.severity() != null && report.getSeverity() != request.severity()) {
            changes.put("severity", AuditWriter.value(report.getSeverity().name(), request.severity().name()));
            report.setSeverity(request.severity());
        }
        if (request.title() != null) {
            String title = request.title().trim();
            if (title.isEmpty() || title.length() > 500) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid title");
            }
            if (!title.equals(report.getTitle())) {
                changes.put("title", AuditWriter.value(report.getTitle(), title));
                report.setTitle(title);
            }
        }
        if (request.description() != null) {
            String description = request.description().trim();
            if (description.isEmpty() || description.length() > 10_000) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid description");
            }
            if (!description.equals(report.getDescription())) {
                changes.put("description", AuditWriter.value(report.getDescription(), description));
                report.setDescription(description);
            }
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

    /** Discards a bug report — a duplicate, or one filed by mistake. */
    @Transactional
    public BasicResponse deleteBugReport(AuthenticatedUser principal, UUID reportId) {
        BugReport report = repository.findByIdForUpdate(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bug report not found"));
        String title = report.getTitle();
        ReportStatus status = report.getStatus();

        repository.delete(report);

        Map<String, Object> changes = AuditWriter.lifecycle(true, false);
        auditWriter.write(
                principal.admin(),
                AuditAction.BUG_REPORT_DELETED,
                AuditTargetType.BUG_REPORT,
                reportId,
                title,
                changes,
                Map.of("status", status.name())
        );
        return new BasicResponse("Deleted bug report successfully", true);
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

        auditWriter.writeStudentAction(
                student,
                AuditAction.BUG_REPORT_CREATED,
                AuditTargetType.BUG_REPORT,
                report.getId(),
                report.getTitle(),
                Map.of("severity", report.getSeverity().name())
        );
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
                UtcDates.format(report.getCreatedAt()),
                report.getIssueUrl(),
                report.getIssueState()
        );
    }

    /**
     * Opens a tracker issue for a bug report, or hands back the one it already has.
     *
     * <p>Idempotent on purpose. A double-clicked button, two admins triaging the same queue
     * and a retry after a timeout must not each open an issue.
     *
     * <p>Admin-triggered rather than automatic on submission. Creating an issue for every
     * report as it arrives would make student-facing bug reporting depend on GitLab being
     * reachable, and would file the duplicates and the spam alongside the real bugs.
     *
     * <p>Deliberately not transactional: the failure path has to persist a marker that the
     * failing transaction would otherwise roll back. See {@link BugReportIssueTransactions}.
     */
    public GitLabIssueResponse createIssue(AuthenticatedUser principal, UUID reportId) {
        if (!gitLabClient.isEnabled()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE, "GitLab integration is not configured");
        }

        BugReportIssueTransactions.Attempt attempt;
        try {
            attempt = issueTransactions.createOrReturnExisting(principal, reportId);
        } catch (ApiException exception) {
            // A missing report is not a failed attempt, and marking one would invent state
            // for a row that does not exist.
            if (exception.getStatus() != HttpStatus.NOT_FOUND) {
                issueTransactions.markFailed(reportId);
            }
            throw exception;
        }

        return new GitLabIssueResponse(
                attempt.existing() ? "Bug report already has a GitLab issue" : "Created GitLab issue",
                true,
                attempt.url(),
                attempt.iid(),
                IssueState.CREATED
        );
    }
}
