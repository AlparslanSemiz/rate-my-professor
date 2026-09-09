package com.pse.audit.revert;

import com.pse.audit.model.AuditTargetType;
import com.pse.moderation.service.ModerationAnswerReportService;
import com.pse.moderation.service.ModerationCommentService;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.enums.ReportStatus;
import com.pse.social.model.AnswerReport;
import com.pse.social.model.CommentReport;
import com.pse.social.repository.AnswerReportRepository;
import com.pse.social.repository.CommentReportRepository;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Undoes a report status change. Worth having: moving a report to {@code ACTION_TAKEN} hides
 * the content it is about, so a status set by mistake takes a post down with it.
 */
public final class ReportStatusRevertHandler {

    private ReportStatusRevertHandler() {
    }

    /**
     * Provides CommentReportHandler.
     */
    @Component
    public static class CommentReportHandler implements AuditRevertHandler {

        private final CommentReportRepository reportRepository;
        private final ModerationCommentService commentService;

        /**
         * Creates CommentReportHandler.
         *
         * @param reportRepository the reportRepository
         * @param commentService the commentService
         */
        public CommentReportHandler(
                CommentReportRepository reportRepository,
                ModerationCommentService commentService
        ) {
            this.reportRepository = reportRepository;
            this.commentService = commentService;
        }

        @Override
        public AuditTargetType targetType() {
            return AuditTargetType.COMMENT_REPORT;
        }

        @Override
        public Map<UUID, Map<String, Object>> currentValues(Collection<UUID> targetIds) {
            Map<UUID, Map<String, Object>> values = new HashMap<>();
            for (CommentReport report : reportRepository.findAllById(targetIds)) {
                Map<String, Object> current = new LinkedHashMap<>();
                current.put("status", report.getStatus().name());
                values.put(report.getId(), current);
            }
            return values;
        }

        @Override
        public void applyInverse(
                AuthenticatedUser principal,
                UUID targetId,
                Map<String, Object> before
        ) {
            commentService.updateReportStatus(
                    principal,
                    targetId,
                    RevertValues.asEnum(before, "status", ReportStatus.class)
            );
        }
    }

    /**
     * Provides AnswerReportHandler.
     */
    @Component
    public static class AnswerReportHandler implements AuditRevertHandler {

        private final AnswerReportRepository reportRepository;
        private final ModerationAnswerReportService answerReportService;

        /**
         * Creates AnswerReportHandler.
         *
         * @param reportRepository the reportRepository
         * @param answerReportService the answerReportService
         */
        public AnswerReportHandler(
                AnswerReportRepository reportRepository,
                ModerationAnswerReportService answerReportService
        ) {
            this.reportRepository = reportRepository;
            this.answerReportService = answerReportService;
        }

        @Override
        public AuditTargetType targetType() {
            return AuditTargetType.ANSWER_REPORT;
        }

        @Override
        public Map<UUID, Map<String, Object>> currentValues(Collection<UUID> targetIds) {
            Map<UUID, Map<String, Object>> values = new HashMap<>();
            for (AnswerReport report : reportRepository.findAllById(targetIds)) {
                Map<String, Object> current = new LinkedHashMap<>();
                current.put("status", report.getStatus().name());
                values.put(report.getId(), current);
            }
            return values;
        }

        @Override
        public void applyInverse(
                AuthenticatedUser principal,
                UUID targetId,
                Map<String, Object> before
        ) {
            answerReportService.updateReportStatus(
                    principal,
                    targetId,
                    RevertValues.asEnum(before, "status", ReportStatus.class)
            );
        }
    }
}
