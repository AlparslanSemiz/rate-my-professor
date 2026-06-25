package com.pse.social.service;

import com.pse.lecture.model.Lecture;
import com.pse.lecture.service.LectureService;
import com.pse.social.model.Answer;
import com.pse.social.model.Comment;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SocialService {

    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private AnswerRepository answerRepository;
    @Autowired
    private LectureService lectureService;



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
}
