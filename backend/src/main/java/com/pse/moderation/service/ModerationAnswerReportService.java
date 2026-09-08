package com.pse.moderation.service;

import com.pse.audit.model.AuditAction;
import com.pse.lecture.dto.LectureLabels;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.shared.dto.BasicResponse;
import com.pse.moderation.dto.response.ReportedAnswerResponse;
import com.pse.moderation.dto.response.ReportedAnswersResponse;
import com.pse.moderation.dto.response.UserReferenceResponse;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.enums.ContentStatus;
import com.pse.shared.enums.ReportStatus;
import com.pse.shared.enums.UserRole;
import com.pse.shared.error.ApiException;
import com.pse.shared.util.UtcDates;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerReport;
import com.pse.social.repository.AnswerReportRepository;
import com.pse.social.repository.AnswerRepository;
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

/**
 * Reports against answers, mirroring {@link ModerationCommentService} for comments. The
 * student app could always file these; until now nothing could act on them.
 */
@Service
public class ModerationAnswerReportService {

    private final AnswerReportRepository reportRepository;
    private final AnswerRepository answerRepository;
    private final WarningRepository warningRepository;
    private final AdminRepository adminRepository;
    private final AuditWriter auditWriter;
    private final Clock clock;

    public ModerationAnswerReportService(
            AnswerReportRepository reportRepository,
            AnswerRepository answerRepository,
            WarningRepository warningRepository,
            AdminRepository adminRepository,
            AuditWriter auditWriter,
            Clock clock
    ) {
        this.reportRepository = reportRepository;
        this.answerRepository = answerRepository;
        this.warningRepository = warningRepository;
        this.adminRepository = adminRepository;
        this.auditWriter = auditWriter;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ReportedAnswersResponse getReportedAnswers() {
        List<ReportedAnswerResponse> answers = reportRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
        return new ReportedAnswersResponse("Success", true, answers);
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
        AnswerReport report = reportRepository.findByIdForUpdate(reportId)
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

        // ACTION_TAKEN is the only status that means "this content was moderated", so it
        // is the only one that hides the answer. Any other status puts it back. Same rule
        // as comment reports.
        Answer answer = report.getAnswer();
        ContentStatus answerBefore = answer.getStatus();
        ContentStatus answerAfter = status == ReportStatus.ACTION_TAKEN
                ? ContentStatus.HIDDEN
                : ContentStatus.VISIBLE;
        if (answerBefore != answerAfter) {
            answer.setStatus(answerAfter);
            answerRepository.save(answer);
            changes.put(
                    "answerStatus",
                    Map.of("before", answerBefore.name(), "after", answerAfter.name())
            );
        }

        auditWriter.write(
                principal.admin(),
                AuditAction.ANSWER_REPORT_STATUS_CHANGED,
                AuditTargetType.ANSWER_REPORT,
                report.getId(),
                reportLabel(report),
                changes,
                Map.of()
        );
        return new BasicResponse("Updated", true);
    }

    /**
     * Removes the report record itself. The reported answer is untouched: withdrawing a
     * report that should not have been filed is not a judgement on the content.
     */
    @Transactional
    public BasicResponse deleteReport(AuthenticatedUser principal, UUID reportId) {
        AnswerReport report = reportRepository.findByIdForUpdate(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Report not found"));
        String label = reportLabel(report);
        ReportStatus status = report.getStatus();

        reportRepository.delete(report);

        Map<String, Object> changes = AuditWriter.lifecycle(true, false);
        auditWriter.write(
                principal.admin(),
                AuditAction.ANSWER_REPORT_DELETED,
                AuditTargetType.ANSWER_REPORT,
                reportId,
                label,
                changes,
                Map.of("status", status.name())
        );
        return new BasicResponse("Deleted report successfully", true);
    }

    private ReportedAnswerResponse toResponse(AnswerReport report) {
        return new ReportedAnswerResponse(
                report.getId(),
                report.getAnswer().getId(),
                report.getAnswer().getComment().getId(),
                report.getAnswer().getContent(),
                report.getAnswer().getComment().getContent(),
                postContext(report),
                report.getExplanation() == null ? "" : report.getExplanation(),
                toUserReference(report.getAnswer().getStudent()),
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

    private String reportLabel(AnswerReport report) {
        return "Report about " + report.getAnswer().getStudent().getUsername()
                + " in " + postContext(report);
    }

    private String postContext(AnswerReport report) {
        return LectureLabels.of(report.getAnswer().getComment().getLecture());
    }
}
