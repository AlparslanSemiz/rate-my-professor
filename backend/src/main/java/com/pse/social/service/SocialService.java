package com.pse.social.service;

import com.pse.lecture.model.Lecture;
import com.pse.lecture.service.LectureService;
import com.pse.shared.enums.ReportReason;
import com.pse.shared.enums.ReportStatus;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerReport;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentReport;
import com.pse.social.repository.AnswerReportRepository;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SocialService {

    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private AnswerRepository answerRepository;
    @Autowired
    private LectureService lectureService;

    @Autowired
    private CommentReportRepository commentReportRepository;
    @Autowired
    private AnswerReportRepository answerReportRepository;


    public boolean submitComment(Student student, String lectureID, String content) {


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


    public boolean submitAnswer(Student student, String commentID, String content) {


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

    public boolean submitCommentReport(Student student, String commentID, ReportReason reportReason, String explanation) {

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


    public boolean submitAnswerReport(Student student, String answerID, ReportReason reportReason, String explanation) {

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

    public List<CommentReport> getReportedComments() {
        return commentReportRepository.findAll();
    }


    public boolean updateReportStatus(UUID reportId, ReportStatus status) {
        CommentReport commentReport = commentReportRepository.findById(reportId).orElse(null);

        if(commentReport == null) {
            return false;
        }

        commentReport.setStatus(status);

        return true;
    }
}
