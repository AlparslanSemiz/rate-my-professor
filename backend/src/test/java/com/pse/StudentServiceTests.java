package com.pse;

import com.pse.shared.enums.VoteType;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerVote;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentVote;
import com.pse.user.dto.StudentProfileResponse;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import com.pse.user.service.StudentService;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class StudentServiceTests {

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private StudentService studentService;


    @Test
    void getUserInformationShouldCalculateAnswerVotes() {
        UUID studentId = UUID.randomUUID();

        Student student = new Student();

        Answer answer = new Answer();

        AnswerVote upvote = new AnswerVote();
        upvote.setVote(VoteType.UP);
        upvote.setAnswer(answer);

        AnswerVote downvote = new AnswerVote();
        downvote.setVote(VoteType.DOWN);
        downvote.setAnswer(answer);

        answer.getVotes().add(upvote);
        answer.getVotes().add(downvote);

        student.getAnswers().add(answer);

        when(studentRepository.findById(studentId))
                .thenReturn(Optional.of(student));

        StudentProfileResponse response =
                studentService.getUserInformation(studentId);

        assertEquals(0, response.credibilityScore());
    }

    @Test
    void getUserInformationShouldCalculateCredibilityScore() {
        UUID studentId = UUID.randomUUID();

        Student student = new Student();

        Comment comment = new Comment();

        CommentVote commentUpvote = new CommentVote();
        commentUpvote.setVote(VoteType.UP);
        commentUpvote.setComment(comment);

        CommentVote commentDownvote = new CommentVote();
        commentDownvote.setVote(VoteType.DOWN);
        commentDownvote.setComment(comment);

        comment.getVotes().add(commentUpvote);
        comment.getVotes().add(commentDownvote);
        student.getComments().add(comment);


        Answer answer = new Answer();

        AnswerVote answerUpvote = new AnswerVote();
        answerUpvote.setVote(VoteType.UP);
        answerUpvote.setAnswer(answer);

        answer.getVotes().add(answerUpvote);
        student.getAnswers().add(answer);


        when(studentRepository.findById(studentId))
                .thenReturn(Optional.of(student));

        StudentProfileResponse response =
                studentService.getUserInformation(studentId);

        assertEquals(1, response.credibilityScore());
    }
}
