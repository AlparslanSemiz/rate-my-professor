package com.pse.moderation.service;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.request.ContentUpdateRequest;
import com.pse.moderation.dto.response.ManagedAnswerResponse;
import com.pse.moderation.dto.response.ManagedAnswersResponse;
import com.pse.moderation.dto.response.ManagedCommentResponse;
import com.pse.moderation.dto.response.ManagedCommentsResponse;
import com.pse.moderation.dto.response.ManagedRatingResponse;
import com.pse.moderation.dto.response.ManagedRatingTopicResponse;
import com.pse.moderation.dto.response.ManagedRatingsResponse;
import com.pse.moderation.dto.response.UserReferenceResponse;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.rating.model.Rating;
import com.pse.rating.repository.RatingRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.enums.ContentStatus;
import com.pse.shared.enums.UserRole;
import com.pse.shared.error.ApiException;
import com.pse.shared.util.UtcDates;
import com.pse.social.model.Answer;
import com.pse.social.model.Comment;
import com.pse.social.repository.AnswerReportRepository;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.social.service.AnswerCleanup;
import com.pse.lecture.model.Lecture;
import com.pse.user.model.Student;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Read and repair the content itself: comments, answers and ratings. Report handling
 * lives in {@link ModerationCommentService} and {@link ModerationAnswerReportService} —
 * this is what lets an admin fix or take down a post without a report existing.
 */
@Service
public class ModerationContentService {

    private static final int MAX_CONTENT_LENGTH = 10_000;
    private static final int PREVIEW_LENGTH = 120;

    private final CommentRepository commentRepository;
    private final AnswerRepository answerRepository;
    private final CommentReportRepository commentReportRepository;
    private final AnswerReportRepository answerReportRepository;
    private final AnswerCleanup answerCleanup;
    private final RatingRepository ratingRepository;
    private final WarningRepository warningRepository;
    private final AdminRepository adminRepository;
    private final AuditWriter auditWriter;

    public ModerationContentService(
            CommentRepository commentRepository,
            AnswerRepository answerRepository,
            CommentReportRepository commentReportRepository,
            AnswerReportRepository answerReportRepository,
            AnswerCleanup answerCleanup,
            RatingRepository ratingRepository,
            WarningRepository warningRepository,
            AdminRepository adminRepository,
            AuditWriter auditWriter
    ) {
        this.commentRepository = commentRepository;
        this.answerRepository = answerRepository;
        this.commentReportRepository = commentReportRepository;
        this.answerReportRepository = answerReportRepository;
        this.answerCleanup = answerCleanup;
        this.ratingRepository = ratingRepository;
        this.warningRepository = warningRepository;
        this.adminRepository = adminRepository;
        this.auditWriter = auditWriter;
    }

    @Transactional(readOnly = true)
    public ManagedCommentsResponse getComments() {
        // Batch queries rather than one per row: the counts and the role lookup would
        // otherwise be three extra queries per comment.
        Set<UUID> adminIds = Set.copyOf(adminRepository.findAllAdminStudentIds());
        Map<UUID, Integer> warningCounts = toCountMap(warningRepository.countGroupedByStudent());
        Map<UUID, Integer> answerCounts = toCountMap(answerRepository.countGroupedByComment());
        Map<UUID, Integer> reportCounts = toCountMap(commentReportRepository.countGroupedByComment());

        List<ManagedCommentResponse> comments = commentRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(comment -> new ManagedCommentResponse(
                        comment.getId(),
                        comment.getContent(),
                        comment.getStatus(),
                        toUserReference(comment.getStudent(), adminIds, warningCounts),
                        lectureLabel(comment.getLecture()),
                        comment.getLecture().getId(),
                        answerCounts.getOrDefault(comment.getId(), 0),
                        reportCounts.getOrDefault(comment.getId(), 0),
                        UtcDates.format(comment.getCreatedAt())
                ))
                .toList();
        return new ManagedCommentsResponse("Successfully found all comments", true, comments);
    }

    @Transactional
    public BasicResponse updateComment(
            AuthenticatedUser principal,
            UUID commentId,
            ContentUpdateRequest request
    ) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));
        Map<String, Object> changes = contentChanges(
                request,
                comment.getContent(),
                comment.getStatus(),
                comment::setContent,
                comment::setStatus
        );
        if (changes.isEmpty()) {
            return new BasicResponse("Updated comment successfully", true);
        }

        commentRepository.save(comment);
        auditWriter.write(
                principal.admin(),
                AuditAction.COMMENT_UPDATED,
                AuditTargetType.COMMENT,
                comment.getId(),
                "Comment by " + comment.getStudent().getUsername()
                        + " in " + lectureLabel(comment.getLecture()),
                changes,
                Map.of()
        );
        return new BasicResponse("Updated comment successfully", true);
    }

    /**
     * Removes a comment and the thread under it. This is a real delete, not a hide: use
     * {@code status = HIDDEN} to take content out of the student app while keeping it.
     */
    @Transactional
    public BasicResponse deleteComment(AuthenticatedUser principal, UUID commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));
        String label = "Comment by " + comment.getStudent().getUsername()
                + " in " + lectureLabel(comment.getLecture());

        List<Answer> answers = answerRepository.findAllByComment(comment);
        int answerCount = answers.size();
        answerCleanup.clear(answers.stream().map(Answer::getId).toList());

        // Votes, answers and reports are cascaded from the comment; the two tables
        // cleared above are the ones that are not.
        commentRepository.delete(comment);

        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("exists", Map.of("before", true, "after", false));
        auditWriter.write(
                principal.admin(),
                AuditAction.COMMENT_DELETED,
                AuditTargetType.COMMENT,
                commentId,
                label,
                changes,
                Map.of("deletedAnswers", answerCount)
        );
        return new BasicResponse("Deleted comment successfully", true);
    }

    @Transactional(readOnly = true)
    public ManagedAnswersResponse getAnswers() {
        Set<UUID> adminIds = Set.copyOf(adminRepository.findAllAdminStudentIds());
        Map<UUID, Integer> warningCounts = toCountMap(warningRepository.countGroupedByStudent());
        Map<UUID, Integer> reportCounts = toCountMap(answerReportRepository.countGroupedByAnswer());

        List<ManagedAnswerResponse> answers = answerRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(answer -> new ManagedAnswerResponse(
                        answer.getId(),
                        answer.getContent(),
                        answer.getStatus(),
                        toUserReference(answer.getStudent(), adminIds, warningCounts),
                        answer.getComment().getId(),
                        preview(answer.getComment().getContent()),
                        lectureLabel(answer.getComment().getLecture()),
                        reportCounts.getOrDefault(answer.getId(), 0),
                        UtcDates.format(answer.getCreatedAt())
                ))
                .toList();
        return new ManagedAnswersResponse("Successfully found all answers", true, answers);
    }

    @Transactional
    public BasicResponse updateAnswer(
            AuthenticatedUser principal,
            UUID answerId,
            ContentUpdateRequest request
    ) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Answer not found"));
        Map<String, Object> changes = contentChanges(
                request,
                answer.getContent(),
                answer.getStatus(),
                answer::setContent,
                answer::setStatus
        );
        if (changes.isEmpty()) {
            return new BasicResponse("Updated answer successfully", true);
        }

        answerRepository.save(answer);
        auditWriter.write(
                principal.admin(),
                AuditAction.ANSWER_UPDATED,
                AuditTargetType.ANSWER,
                answer.getId(),
                "Answer by " + answer.getStudent().getUsername()
                        + " in " + lectureLabel(answer.getComment().getLecture()),
                changes,
                Map.of()
        );
        return new BasicResponse("Updated answer successfully", true);
    }

    @Transactional
    public BasicResponse deleteAnswer(AuthenticatedUser principal, UUID answerId) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Answer not found"));
        String label = "Answer by " + answer.getStudent().getUsername()
                + " in " + lectureLabel(answer.getComment().getLecture());

        answerCleanup.clear(List.of(answerId));
        answerRepository.delete(answer);

        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("exists", Map.of("before", true, "after", false));
        auditWriter.write(
                principal.admin(),
                AuditAction.ANSWER_DELETED,
                AuditTargetType.ANSWER,
                answerId,
                label,
                changes,
                Map.of()
        );
        return new BasicResponse("Deleted answer successfully", true);
    }

    @Transactional(readOnly = true)
    public ManagedRatingsResponse getRatings() {
        Set<UUID> adminIds = Set.copyOf(adminRepository.findAllAdminStudentIds());
        Map<UUID, Integer> warningCounts = toCountMap(warningRepository.countGroupedByStudent());

        List<ManagedRatingResponse> ratings = ratingRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(rating -> new ManagedRatingResponse(
                        rating.getId(),
                        toUserReference(rating.getStudent(), adminIds, warningCounts),
                        lectureLabel(rating.getLecture()),
                        rating.getLecture().getId(),
                        rating.getTopics().stream()
                                .map(topic -> new ManagedRatingTopicResponse(
                                        topic.getCategory(),
                                        topic.getValue()
                                ))
                                .toList(),
                        UtcDates.format(rating.getCreatedAt())
                ))
                .toList();
        return new ManagedRatingsResponse("Successfully found all ratings", true, ratings);
    }

    /**
     * Discards a rating. Deliberately delete-only: rewriting someone's scores would put
     * an opinion they never gave into the lecture average, so a bogus rating is removed
     * rather than corrected.
     */
    @Transactional
    public BasicResponse deleteRating(AuthenticatedUser principal, UUID ratingId) {
        Rating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Rating not found"));
        String label = "Rating by " + rating.getStudent().getUsername()
                + " for " + lectureLabel(rating.getLecture());
        int topics = rating.getTopics().size();

        // The topic rows are cascaded from the rating.
        ratingRepository.delete(rating);

        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("exists", Map.of("before", true, "after", false));
        auditWriter.write(
                principal.admin(),
                AuditAction.RATING_DELETED,
                AuditTargetType.RATING,
                ratingId,
                label,
                changes,
                Map.of("topicCount", topics)
        );
        return new BasicResponse("Deleted rating successfully", true);
    }

    private Map<String, Object> contentChanges(
            ContentUpdateRequest request,
            String currentContent,
            ContentStatus currentStatus,
            java.util.function.Consumer<String> applyContent,
            java.util.function.Consumer<ContentStatus> applyStatus
    ) {
        if (request == null || (request.content() == null && request.status() == null)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No update supplied");
        }

        Map<String, Object> changes = new LinkedHashMap<>();
        if (request.content() != null) {
            String content = request.content().trim();
            if (content.isEmpty() || content.length() > MAX_CONTENT_LENGTH) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid content");
            }
            if (!content.equals(currentContent)) {
                changes.put("content", change(preview(currentContent), preview(content)));
                applyContent.accept(content);
            }
        }
        if (request.status() != null && request.status() != currentStatus) {
            changes.put("status", change(currentStatus.name(), request.status().name()));
            applyStatus.accept(request.status());
        }
        return changes;
    }

    private UserReferenceResponse toUserReference(
            Student student,
            Set<UUID> adminIds,
            Map<UUID, Integer> warningCounts
    ) {
        return new UserReferenceResponse(
                student.getId(),
                student.getUsername(),
                adminIds.contains(student.getId()) ? UserRole.ADMIN : UserRole.STUDENT,
                warningCounts.getOrDefault(student.getId(), 0),
                student.getStatus()
        );
    }

    private static String lectureLabel(Lecture lecture) {
        String code = lecture.getCode();
        String name = lecture.getName();
        return code == null || code.isBlank() ? name : code + " — " + name;
    }

    private static String preview(String content) {
        String text = content == null ? "" : content;
        return text.length() <= PREVIEW_LENGTH ? text : text.substring(0, PREVIEW_LENGTH) + "…";
    }

    private static Map<UUID, Integer> toCountMap(List<Object[]> rows) {
        Map<UUID, Integer> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((UUID) row[0], ((Number) row[1]).intValue());
        }
        return counts;
    }

    private static Map<String, Object> change(Object before, Object after) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("before", before);
        value.put("after", after);
        return value;
    }
}
