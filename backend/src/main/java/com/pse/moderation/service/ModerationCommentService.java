package com.pse.moderation.service;

import com.pse.audit.model.AuditAction;
import com.pse.lecture.dto.LectureLabels;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.shared.dto.BasicResponse;
import com.pse.moderation.dto.response.ReportedCommentResponse;
import com.pse.moderation.dto.response.ReportedCommentsResponse;
import com.pse.moderation.dto.response.UserReferenceResponse;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.enums.ContentStatus;
import com.pse.shared.enums.ReportStatus;
import com.pse.shared.enums.UserRole;
import com.pse.shared.error.ApiException;
import com.pse.shared.util.UtcDates;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentReport;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.user.model.Student;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ModerationCommentService {

    private final CommentReportRepository reportRepository;
    private final CommentRepository commentRepository;
    private final WarningRepository warningRepository;
    private final AdminRepository adminRepository;
    private final AuditWriter auditWriter;
    private final Clock clock;

    public ModerationCommentService(
            CommentReportRepository reportRepository,
            CommentRepository commentRepository,
            WarningRepository warningRepository,
            AdminRepository adminRepository,
            AuditWriter auditWriter,
            Clock clock
    ) {
        this.reportRepository = reportRepository;
        this.commentRepository = commentRepository;
        this.warningRepository = warningRepository;
        this.adminRepository = adminRepository;
        this.auditWriter = auditWriter;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ReportedCommentsResponse getReportedComments() {
        List<ReportedCommentResponse> comments = reportRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
        return new ReportedCommentsResponse(
                "Success",
                true,
                comments
        );
    }

    @Transactional
    public BasicResponse updateReportStatus(
            AuthenticatedUser principal,
            UUID reportId,
            ReportStatus status
    ) {
        if (status == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid report status");
        }
        CommentReport report = reportRepository.findByIdForUpdate(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Report not found"));
        if (report.getStatus() == status) {
            return new BasicResponse("Updated", true);
        }

        ReportStatus before = report.getStatus();
        report.setStatus(status);
        report.setReviewedBy(principal.admin());
        report.setReviewedAt(LocalDateTime.now(clock));
        reportRepository.save(report);

        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("status", Map.of("before", before.name(), "after", status.name()));

        // ACTION_TAKEN is the only status that means "this content was moderated",
        // so it is the only one that hides the comment. Moving the report to any
        // other status puts the comment back. Answers are nested under the comment
        // in the student read path, so they disappear and return with it.
        Comment comment = report.getComment();
        ContentStatus commentBefore = comment.getStatus();
        ContentStatus commentAfter = status == ReportStatus.ACTION_TAKEN
                ? ContentStatus.HIDDEN
                : ContentStatus.VISIBLE;
        if (commentBefore != commentAfter) {
            comment.setStatus(commentAfter);
            commentRepository.save(comment);
            changes.put(
                    "commentStatus",
                    Map.of("before", commentBefore.name(), "after", commentAfter.name())
            );
        }

        auditWriter.write(
                principal.admin(),
                AuditAction.COMMENT_REPORT_STATUS_CHANGED,
                AuditTargetType.COMMENT_REPORT,
                report.getId(),
                "Report about " + report.getComment().getStudent().getUsername()
                        + " in " + postContext(report),
                changes,
                Map.of()
        );
        return new BasicResponse("Updated", true);
    }

    /**
     * Removes the report record itself. The reported comment is untouched: withdrawing a
     * report that should not have been filed is not a judgement on the content.
     */
    @Transactional
    public BasicResponse deleteReport(AuthenticatedUser principal, UUID reportId) {
        CommentReport report = reportRepository.findByIdForUpdate(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Report not found"));
        String label = "Report about " + report.getComment().getStudent().getUsername()
                + " in " + postContext(report);
        ReportStatus status = report.getStatus();

        reportRepository.delete(report);

        Map<String, Object> changes = AuditWriter.lifecycle(true, false);
        auditWriter.write(
                principal.admin(),
                AuditAction.COMMENT_REPORT_DELETED,
                AuditTargetType.COMMENT_REPORT,
                reportId,
                label,
                changes,
                Map.of("status", status.name())
        );
        return new BasicResponse("Deleted report successfully", true);
    }

    private ReportedCommentResponse toResponse(CommentReport report) {
        return new ReportedCommentResponse(
                report.getId(),
                report.getComment().getId(),
                report.getComment().getContent(),
                postContext(report),
                report.getExplanation() == null ? "" : report.getExplanation(),
                toUserReference(report.getComment().getStudent()),
                toUserReference(report.getReporter()),
                report.getReason(),
                report.getStatus(),
                UtcDates.format(report.getCreatedAt())
        );
    }

    private UserReferenceResponse toUserReference(Student student) {
        return new UserReferenceResponse(
                student.getId(),
                student.getUsername(),
                adminRepository.existsByStudent(student) ? UserRole.ADMIN : UserRole.STUDENT,
                Math.toIntExact(warningRepository.countByStudent(student)),
                student.getStatus()
        );
    }

    private String postContext(CommentReport report) {
        return LectureLabels.of(report.getComment().getLecture());
    }
}
