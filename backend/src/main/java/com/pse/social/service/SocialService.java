package com.pse.social.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.pse.shared.util.ProfilePictureGenerator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.shared.dto.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.service.LectureService;
import com.pse.shared.enums.ContentStatus;
import com.pse.shared.enums.NotificationType;
import com.pse.shared.enums.ReportReason;
import com.pse.shared.enums.ReportStatus;
import com.pse.shared.enums.VoteType;
import com.pse.social.dto.request.AnswerReportRequest;
import com.pse.social.dto.request.AnswerSubmitRequest;
import com.pse.social.dto.request.CommentReportRequest;
import com.pse.social.dto.request.CommentSubmitRequest;
import com.pse.social.dto.request.VoteAnswerRequest;
import com.pse.social.dto.request.VoteCommentRequest;
import com.pse.social.dto.response.AnswerResponse;
import com.pse.social.dto.response.CommentResponse;
import com.pse.social.dto.response.CommentsResponse;
import com.pse.social.dto.response.NotificationResponse;
import com.pse.social.dto.response.NotificationsResponse;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerReport;
import com.pse.social.model.AnswerVote;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentReport;
import com.pse.social.model.CommentVote;
import com.pse.social.model.Notification;
import com.pse.social.repository.AnswerReportRepository;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.repository.AnswerVoteRepository;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.social.repository.CommentVoteRepository;
import com.pse.social.repository.NotificationRepository;
import com.pse.shared.error.ApiException;
import com.pse.user.model.Student;


/**
 * Provides Comment-related business logic.
 * Handles comments/answers submition and reporting comments/answers.
 */
@Service
public class SocialService {

    private final LectureService lectureService;


    private final CommentRepository commentRepository;
    private final AnswerRepository answerRepository;
    private final CommentReportRepository commentReportRepository;
    private final AnswerReportRepository answerReportRepository;
    private final CommentVoteRepository commentVoteRepository;
    private final AnswerVoteRepository answerVoteRepository;

    private final NotificationRepository notificationRepository;

    private final AuditWriter auditWriter;

    public SocialService(LectureService lectureService,
                         CommentRepository commentRepository,
                         AnswerRepository answerRepository,
                         CommentReportRepository commentReportRepository,
                         AnswerReportRepository answerReportRepository,
                         CommentVoteRepository commentVoteRepository,
                         AnswerVoteRepository answerVoteRepository,
                         NotificationRepository notificationRepository,
                         AuditWriter auditWriter) {

        this.lectureService = lectureService;
        this.commentRepository = commentRepository;
        this.answerRepository = answerRepository;
        this.commentReportRepository = commentReportRepository;
        this.answerReportRepository = answerReportRepository;
        this.commentVoteRepository = commentVoteRepository;
        this.answerVoteRepository = answerVoteRepository;
        this.notificationRepository = notificationRepository;
        this.auditWriter = auditWriter;

    }





    @Transactional
    public BasicResponse submitComment(Student student, CommentSubmitRequest request) {

        if (!submitComment(student, request.lectureID(), request.content())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Lecture not found");
        }

        return new BasicResponse("Comment submitted successfully", true);
    }

    private boolean submitComment(Student student, String lectureID, String content) {

        Lecture lecture = lectureService.getLectureByID(lectureID);
        if (lecture == null) {
            return false;
        }

        Comment comment = new Comment();

        comment.setStudent(student);
        comment.setContent(content);
        comment.setLecture(lecture);

        commentRepository.save(comment);

        auditWriter.writeStudentAction(
                student,
                AuditAction.COMMENT_CREATED,
                AuditTargetType.COMMENT,
                comment.getId(),
                lectureLabel(lecture),
                contentMetadata(content)
        );

        return true;

    }

    /**
     * Transactional so the vote and the audit entry commit together -- {@link AuditWriter}
     * joins the caller's transaction on purpose, and a vote recorded without its entry is
     * exactly the blind spot F-1 describes.
     */
    @Transactional
    public BasicResponse voteComment(UUID commentId, Student student, VoteCommentRequest request) {

        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Comment not found");
        }

        //check if user has already up/down voted this comment. If yes => update this entry

        CommentVote commentVote = commentVoteRepository.findByStudentAndComment(student, comment).orElse(null);

        // F-3: NONE withdraws the vote rather than recording a third direction, so the row
        // goes away and the column never has to hold it.
        if (request.voteType() == VoteType.NONE) {
            if (commentVote != null) {
                commentVoteRepository.delete(commentVote);
            }
            writeVoteAudit(student, AuditAction.COMMENT_VOTED, AuditTargetType.COMMENT,
                    comment.getId(), voteLabel(comment.getStudent(), comment.getLecture()),
                    VoteType.NONE);
            return new BasicResponse("Comment vote withdrawn successfully", true);
        }

        if(commentVote != null) {
            commentVote.setVote(request.voteType());
        }else{
            commentVote = new CommentVote();
            commentVote.setStudent(student);
            commentVote.setComment(comment);
            commentVote.setVote(request.voteType());
        }

        commentVoteRepository.save(commentVote);

        writeVoteAudit(student, AuditAction.COMMENT_VOTED, AuditTargetType.COMMENT,
                comment.getId(), voteLabel(comment.getStudent(), comment.getLecture()),
                request.voteType());

        return new BasicResponse("Comment vote saved successfully", true);

    }


    @Transactional(readOnly = true)
    public CommentsResponse getAllComments() {

        List<Comment> comments = commentRepository.findAllByStatus(ContentStatus.VISIBLE);

        List<CommentResponse> commentsResponses = new ArrayList<>();

        for (Comment comment : comments) {
            commentsResponses.add(createCommentResponse(comment, null));
        }

        return new CommentsResponse("Comments loaded successfully", true, commentsResponses);
    }


    @Transactional
    public BasicResponse submitAnswer(Student student, AnswerSubmitRequest request) {

        if(!submitAnswer(student, request.commentID(), request.content())){
            throw new ApiException(HttpStatus.NOT_FOUND, "Comment not found");
        }

        return new BasicResponse("Answer submitted successfully",true);
    }

    private boolean submitAnswer(Student student, String commentID, String content) {

        Comment comment = commentRepository.findById(UUID.fromString(commentID)).orElse(null);
        if(comment == null) {
            return false;
        }

        Answer answer = new Answer();
        answer.setStudent(student);
        answer.setContent(content);
        answer.setComment(comment);

        answerRepository.save(answer);


        //Add to notification Table
        Notification notification = new Notification();
        notification.setRecipient(comment.getStudent());
        notification.setLecture(comment.getLecture());
        notification.setOwnComment(comment);
        notification.setType(NotificationType.ANSWER);
        notification.setAnswer(answer);
        notificationRepository.save(notification);

        auditWriter.writeStudentAction(
                student,
                AuditAction.ANSWER_CREATED,
                AuditTargetType.ANSWER,
                answer.getId(),
                "Answer to " + comment.getStudent().getUsername()
                        + " in " + lectureLabel(comment.getLecture()),
                contentMetadata(content)
        );

        return true;
    }


    /** The answer half of {@link #voteComment}, transactional for the same reason. */
    @Transactional
    public BasicResponse voteAnswer(UUID answerID, Student student, VoteAnswerRequest request) {

        Answer answer = answerRepository.findById(answerID).orElse(null);
        if (answer == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Answer not found");
        }

        //check if user has already up/down voted this comment. If yes => update this entry

        AnswerVote answerVote = answerVoteRepository.findByStudentAndAnswer(student, answer).orElse(null);

        if (request.voteType() == VoteType.NONE) {
            if (answerVote != null) {
                answerVoteRepository.delete(answerVote);
            }
            writeVoteAudit(student, AuditAction.ANSWER_VOTED, AuditTargetType.ANSWER,
                    answer.getId(), voteLabel(answer.getStudent(), answer.getComment().getLecture()),
                    VoteType.NONE);
            return new BasicResponse("Answer vote withdrawn successfully", true);
        }

        if(answerVote != null) {
            answerVote.setVote(request.voteType());
        }else{
            answerVote = new AnswerVote();
            answerVote.setStudent(student);
            answerVote.setAnswer(answer);
            answerVote.setVote(request.voteType());
        }
        answerVoteRepository.save(answerVote);

        writeVoteAudit(student, AuditAction.ANSWER_VOTED, AuditTargetType.ANSWER,
                answer.getId(), voteLabel(answer.getStudent(), answer.getComment().getLecture()),
                request.voteType());

        return new BasicResponse("Answer vote saved successfully", true);
    }



    @Transactional
    public BasicResponse submitCommentReport(Student student, CommentReportRequest request) {

        if(!submitCommentReport(student, request.commentID(), request.reportReason(), request.explanation())){
            throw new ApiException(HttpStatus.NOT_FOUND, "Comment not found");
        }

        return new BasicResponse("Comment Report submitted successfully",true);

    }

    private boolean submitCommentReport(Student student, String commentID, ReportReason reportReason, String explanation) {

        Comment comment = commentRepository.findById(UUID.fromString(commentID)).orElse(null);
        if(comment == null) {
            return false;
        }

        CommentReport report = new CommentReport();

        report.setReporter(student);
        report.setComment(comment);
        report.setReason(reportReason);
        report.setExplanation(explanation);

        commentReportRepository.save(report);

        auditWriter.writeStudentAction(
                student,
                AuditAction.COMMENT_REPORT_CREATED,
                AuditTargetType.COMMENT_REPORT,
                report.getId(),
                "Report about " + comment.getStudent().getUsername()
                        + " in " + lectureLabel(comment.getLecture()),
                Map.of("reason", reportReason == null ? "UNSPECIFIED" : reportReason.name())
        );

        return true;

    }


    @Transactional
    public BasicResponse submitAnswerReport(Student student, AnswerReportRequest request) {

        if(!submitAnswerReport(student, request.answerID(), request.reportReason(), request.explanation())){
            throw new ApiException(HttpStatus.NOT_FOUND, "Answer not found");
        }

        return new BasicResponse("Answer Report submitted successfully",true);
    }

    private boolean submitAnswerReport(Student student, String answerID, ReportReason reportReason, String explanation) {

        Answer answer = answerRepository.findById(UUID.fromString(answerID)).orElse(null);
        if(answer == null) {
            return false;
        }

        AnswerReport report = new AnswerReport();

        report.setReporter(student);
        report.setAnswer(answer);
        report.setReason(reportReason);
        report.setExplanation(explanation);

        answerReportRepository.save(report);

        auditWriter.writeStudentAction(
                student,
                AuditAction.ANSWER_REPORT_CREATED,
                AuditTargetType.ANSWER_REPORT,
                report.getId(),
                "Report about " + answer.getStudent().getUsername()
                        + " in " + lectureLabel(answer.getComment().getLecture()),
                Map.of("reason", reportReason == null ? "UNSPECIFIED" : reportReason.name())
        );

        return true;

    }

    @Transactional(readOnly = true)
    public NotificationsResponse getNotifications(Student student) {

        List<Notification> notifications = notificationRepository.findAllByRecipientAndSeenFalseOrderByCreatedAtDesc(student);

        List<NotificationResponse> notificationResponses = new ArrayList<>();


        for(Notification notification : notifications) {

            // Rows written before the type column existed are answer notifications.
            NotificationType type = notification.getType() == null
                    ? NotificationType.ANSWER
                    : notification.getType();

            if (type == NotificationType.WARNING) {
                notificationResponses.add(
                        new NotificationResponse(
                                notification.getId(),
                                type,
                                null,
                                null,
                                null,
                                null,
                                notification.getMessage(),
                                notification.getCreatedAt()
                        ));
                continue;
            }

            notificationResponses.add(
                    new NotificationResponse(
                            notification.getId(),
                            type,
                            LectureService.createLectureResponse(notification.getLecture()),
                            notification.getOwnComment().getId(),
                            notification.getAnswer().getStudent().getUsername(),
                            notification.getAnswer().getContent(),
                            null,
                            notification.getCreatedAt()
                    ));
        }

        return new NotificationsResponse("Found: " + notificationResponses.size() + " Notifications", true, notificationResponses);

    }


    @Transactional(readOnly = true)
    public CommentsResponse getComments(UUID lecture_id, Student student) {

        // Only VISIBLE comments reach the student app. A comment is set to HIDDEN
        // when an admin resolves a report against it as ACTION_TAKEN.
        List<Comment> comments = commentRepository
                .findAllByLectureIdAndStatus(lecture_id, ContentStatus.VISIBLE);

        List<CommentResponse> commentsResponses = new ArrayList<>();

        for(Comment comment : comments) {

            commentsResponses.add(createCommentResponse(comment, student));
        }

        return new CommentsResponse("Found " + commentsResponses.size() + " comments", true, commentsResponses);
    }






    //If student is null => userVote = null
    public CommentResponse createCommentResponse(Comment comment, Student student){

        List<AnswerResponse> answerResponses = getAnswerResponses(comment, student);

        VoteType userVote = null;

        if (student != null) {
            CommentVote vote = commentVoteRepository.findByStudentAndComment(student, comment).orElse(null);

            if (vote != null) {
                userVote = vote.getVote();
            }
        }

        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getStatus(),
                comment.getStudent().getUsername(),
                ProfilePictureGenerator.generateProfilePicture(comment.getStudent()),
                comment.getLecture().getId(),
                comment.getCreatedAt(),
                commentVoteRepository.countByCommentAndVote(comment, VoteType.DOWN),
                commentVoteRepository.countByCommentAndVote(comment, VoteType.UP),
                userVote,
                answerResponses
        );
    }

    public AnswerResponse createAnswerResponse(Answer answer, Student student){

        VoteType userVote = null;

        if (student != null) {
            AnswerVote vote = answerVoteRepository.findByStudentAndAnswer(student, answer).orElse(null);

            if (vote != null) {
                userVote = vote.getVote();
            }
        }

        return new AnswerResponse(
                answer.getId(),
                answer.getContent(),
                answer.getStatus(),
                answer.getStudent().getUsername(),
                ProfilePictureGenerator.generateProfilePicture(answer.getStudent()),
                answer.getCreatedAt(),
                answerVoteRepository.countByAnswerAndVote(answer, VoteType.DOWN),
                answerVoteRepository.countByAnswerAndVote(answer, VoteType.UP),
                userVote
        );
    }





    private List<AnswerResponse> getAnswerResponses(Comment comment, Student student) {

        List<Answer> answers = comment.getAnswers();
        List<AnswerResponse> answerResponses = new ArrayList<>();
        for(Answer answer : answers) {

            // Hidden answers must not reach students once an admin has resolved a
            // report against them as ACTION_TAKEN, mirroring the comment filter above.
            if (answer.getStatus() != ContentStatus.VISIBLE) {
                continue;
            }

            answerResponses.add(createAnswerResponse(answer, student));
        }
        return answerResponses;
    }



    @Transactional
    public BasicResponse markNotificationAsSeen(Student student, UUID notificationId) {

        //check that student owns notification
        Notification notification = notificationRepository
                .findByRecipientAndId(student, notificationId)
                .orElse(null);


        if(notification == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Notification not found");
        }

        notification.setSeen(true);

        return new BasicResponse("Marked Notifications as seen", true);

    }


    /**
     * The lecture a piece of content belongs to, formatted the way the reported-comments
     * endpoint formats its {@code postContext}.
     */
    /**
     * F-1. Every other write in this class recorded itself; the two vote methods did not, so
     * an account flipping hundreds of votes left no trace on the moderation side at all.
     * The direction is metadata rather than a change set, because a vote has no "before":
     * an overwrite and a first vote are the same action from the log's point of view.
     */
    private void writeVoteAudit(
            Student student,
            AuditAction action,
            AuditTargetType targetType,
            UUID targetId,
            String targetLabel,
            VoteType vote
    ) {
        auditWriter.writeStudentAction(
                student,
                action,
                targetType,
                targetId,
                targetLabel,
                // Null-safe for the same reason submitCommentReport is: the vote type is
                // validated at the boundary (F-2), and the audit write must not be the thing
                // that turns a request that slipped past it into an NPE.
                Map.of("vote", vote == null ? "UNSPECIFIED" : vote.name())
        );
    }

    private String voteLabel(Student author, Lecture lecture) {
        return "Vote on " + author.getUsername() + " in " + lectureLabel(lecture);
    }

    private String lectureLabel(Lecture lecture) {
        String code = lecture.getCode();
        String name = lecture.getName();
        return code == null || code.isBlank() ? name : code + " — " + name;
    }

    /**
     * A preview of submitted text. The full body stays in its own table; the activity
     * log only needs enough to recognise the entry.
     */
    private Map<String, Object> contentMetadata(String content) {
        String text = content == null ? "" : content;
        return Map.of(
                "contentPreview", text.substring(0, Math.min(text.length(), 120)),
                "contentLength", text.length()
        );
    }

}
