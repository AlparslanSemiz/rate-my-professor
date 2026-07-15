package com.pse.social.service;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.service.LectureService;
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
import com.pse.social.dto.response.AnswersResponse;
import com.pse.social.dto.response.CommentResponse;
import com.pse.social.dto.response.CommentsResponse;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerReport;
import com.pse.social.model.AnswerVote;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentReport;
import com.pse.social.model.CommentVote;
import com.pse.social.repository.AnswerReportRepository;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.repository.AnswerVoteRepository;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.social.repository.CommentVoteRepository;
import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


/**
 * Provides Comment-related business logic.
 * Handles comments/answers submition and reporting comments/answers.
 */
@Service
public class SocialService {

    @Autowired
    private LectureService lectureService;
    @Autowired
    private AuthService authService;


    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private AnswerRepository answerRepository;
    @Autowired
    private CommentReportRepository commentReportRepository;
    @Autowired
    private AnswerReportRepository answerReportRepository;
    @Autowired
    private CommentVoteRepository commentVoteRepository;
    @Autowired
    private AnswerVoteRepository answerVoteRepository;





    public BasicResponse submitComment(String authHeader, CommentSubmitRequest request) {

        Student student = authService.verifyUser(authHeader);

        if (student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }

        if (!submitComment(student, request.lectureID(), request.content())) {
            return new BasicResponse("Error, cannot submit comment", false);
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

        return true;

    }

    public BasicResponse voteComment(UUID commentId, String authHeader, VoteCommentRequest request) {

        Student student = authService.verifyUser(authHeader);

        if (student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }

        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null) {
            return new BasicResponse("Error, cannot find comment", false);
        }


        //check if user has already up/down voted this comment
        //Falls ja, update diesen Eintrag

        CommentVote commentVote = commentVoteRepository.findByStudentAndComment(student, comment).orElse(null);

        if(commentVote != null) {

            commentVote.setVote(request.voteType());

        }else{
            commentVote = new CommentVote();
            commentVote.setStudent(student);
            commentVote.setComment(comment);
            commentVote.setVote(request.voteType());
        }

        commentVoteRepository.save(commentVote);

        return new BasicResponse("Comment vote saved successfully", true);

    }


    public BasicResponse submitAnswer(String authHeader, AnswerSubmitRequest request) {

        Student student = authService.verifyUser(authHeader);

        if(student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }

        if(!submitAnswer(student, request.commentID(), request.content())){
            return new BasicResponse("Error, couldnt finde comment",false);
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
        return true;
    }


    public BasicResponse voteAnswer(UUID answerID, String authHeader, VoteAnswerRequest request) {


        Student student = authService.verifyUser(authHeader);

        if (student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }

        Answer answer = answerRepository.findById(answerID).orElse(null);
        if (answer == null) {
            return new BasicResponse("Error, cannot find Answer", false);
        }


        //check if user has already up/down voted this comment
        //Falls ja, update diesen Eintrag

        AnswerVote answerVote = answerVoteRepository.findByStudentAndAnswer(student, answer).orElse(null);

        if(answerVote != null) {

            answerVote.setVote(request.voteType());

        }else{
            answerVote = new AnswerVote();
            answerVote.setStudent(student);
            answerVote.setAnswer(answer);
            answerVote.setVote(request.voteType());
        }

        answerVoteRepository.save(answerVote);

        return new BasicResponse("Answer vote saved successfully", true);


    }



    public BasicResponse submitCommentReport(String authHeader, CommentReportRequest request) {

        Student student = authService.verifyUser(authHeader);

        if(student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }

        if(!submitCommentReport(student, request.commentID(), request.reportReason(), request.explanation())){
            return new BasicResponse("Error, couldnt finde comment",false);
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

        return true;

    }


    public BasicResponse submitAnswerReport(String authHeader, AnswerReportRequest request) {

        Student student = authService.verifyUser(authHeader);

        if(student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }

        if(!submitAnswerReport(student, request.answerID(), request.reportReason(), request.explanation())){
            return new BasicResponse("Error, couldnt finde answer",false);
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

        return true;

    }




    //Methods used by other Services

    public boolean updateReportStatus(UUID reportId, ReportStatus status) {
        CommentReport commentReport = commentReportRepository.findById(reportId).orElse(null);

        if(commentReport == null) {
            return false;
        }

        commentReport.setStatus(status);

        return true;
    }



    //Repository methods

    public List<CommentReport> getReportedComments() {
        return commentReportRepository.findAll();
    }


    public CommentsResponse getComments(UUID lecture_id) {

        List<Comment> comments = commentRepository.findAllByLectureId(lecture_id);

        List<CommentResponse> commentsResponses = new ArrayList<>();

        for(Comment comment : comments) {

            List<AnswerResponse> answerResponses = getAnswerResponses(comment);

            commentsResponses.add(new CommentResponse(
                    comment.getContent(),
                    comment.getStatus(),
                    comment.getStudent().getUsername(),
                    comment.getLecture().getId(),
                    comment.getCreatedAt(),
                    commentVoteRepository.countByCommentAndVote(comment, VoteType.DOWN),
                    commentVoteRepository.countByCommentAndVote(comment, VoteType.UP),
                    answerResponses
            ));

        }



        return new CommentsResponse("Found comments", true, commentsResponses);
    }

    private List<AnswerResponse> getAnswerResponses(Comment comment) {

        List<Answer> answers = comment.getAnswers();
        List<AnswerResponse> answerResponses = new ArrayList<>();
        for(Answer answer : answers) {

            answerResponses.add(new AnswerResponse(
                    answer.getComment().getId(),
                    answer.getContent(),
                    answer.getStatus(),
                    answer.getStudent().getUsername(),
                    answer.getCreatedAt(),
                    answerVoteRepository.countByAnswerAndVote(answer, VoteType.DOWN),
                    answerVoteRepository.countByAnswerAndVote(answer, VoteType.UP)
                    ));
        }
        return answerResponses;
    }



}
