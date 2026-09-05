package com.pse.social;

import com.pse.audit.repository.AuditLogRepository;
import com.pse.auth.model.Token;
import com.pse.auth.repository.AuthRateLimitBucketRepository;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.auth.repository.TokenRepository;
import com.pse.auth.service.TokenGenerator;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.BugReportRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.rating.repository.RatingRepository;
import com.pse.shared.enums.ContentStatus;
import com.pse.shared.enums.ReportReason;
import com.pse.shared.enums.SemesterSeason;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.enums.VoteType;
import com.pse.shared.util.HashGenerator;
import com.pse.social.model.Answer;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentVote;
import com.pse.social.model.Notification;
import com.pse.social.repository.*;
import com.pse.support.TestDeliveryConfig;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({
        TestDeliveryConfig.class,
        com.pse.support.TestGitLabConfig.class
})
class SocialApiIntegrationTests {

    @Autowired MockMvc mockMvc;

    @Autowired StudentRepository studentRepository;
    @Autowired TokenRepository tokenRepository;

    @Autowired LectureRepository lectureRepository;
    @Autowired ProfessorRepository professorRepository;

    @Autowired CommentRepository commentRepository;
    @Autowired CommentVoteRepository commentVoteRepository;
    @Autowired CommentReportRepository commentReportRepository;

    @Autowired AnswerRepository answerRepository;
    @Autowired AnswerVoteRepository answerVoteRepository;
    @Autowired AnswerReportRepository answerReportRepository;

    @Autowired NotificationRepository notificationRepository;

    @Autowired AuditLogRepository auditLogRepository;
    @Autowired WarningRepository warningRepository;
    @Autowired BugReportRepository bugReportRepository;
    @Autowired RatingRepository ratingRepository;

    @Autowired OneTimePasswordRepository otpRepository;
    @Autowired AuthRateLimitBucketRepository rateLimitRepository;
    @Autowired AdminRepository adminRepository;


    @BeforeEach
    void cleanDatabase() {

        auditLogRepository.deleteAll();

        notificationRepository.deleteAll();
        warningRepository.deleteAll();

        answerReportRepository.deleteAll();
        answerVoteRepository.deleteAll();
        answerRepository.deleteAll();

        commentReportRepository.deleteAll();
        commentVoteRepository.deleteAll();
        commentRepository.deleteAll();

        bugReportRepository.deleteAll();
        ratingRepository.deleteAll();

        tokenRepository.deleteAll();
        otpRepository.deleteAll();
        rateLimitRepository.deleteAll();

        adminRepository.deleteAll();

        lectureRepository.deleteAll();
        professorRepository.deleteAll();

        studentRepository.deleteAll();
    }


    @Test
    void studentCanSubmitCommentAndCommentCanBeLoaded() throws Exception {

        Session student =
                createSession(
                        "author@student.kit.edu"
                );

        Lecture lecture =
                createLecture();


        mockMvc.perform(
                        post("/social/comments")
                                .header(
                                        "Authorization",
                                        bearer(
                                                student.rawToken()
                                        )
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "lectureID":"%s",
                                          "content":"Very helpful lecture"
                                        }
                                        """.formatted(
                                        lecture.getId()
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Comment submitted successfully"
                                )
                );


        assertEquals(
                1,
                commentRepository.count()
        );

        Comment comment =
                commentRepository
                        .findAll()
                        .getFirst();

        assertEquals(
                "Very helpful lecture",
                comment.getContent()
        );

        assertEquals(
                student.student().getId(),
                comment.getStudent().getId()
        );

        assertEquals(
                lecture.getId(),
                comment.getLecture().getId()
        );


        mockMvc.perform(
                        get(
                                "/social/comments/{lectureId}",
                                lecture.getId()
                        )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.comments",
                                hasSize(1))
                )
                .andExpect(
                        jsonPath("$.comments[0].content")
                                .value(
                                        "Very helpful lecture"
                                )
                );
    }


    @Test
    void votingCommentTwiceUpdatesVoteInsteadOfCreatingDuplicate() throws Exception {

        Session author =
                createSession(
                        "author@student.kit.edu"
                );

        Session voter =
                createSession(
                        "voter@student.kit.edu"
                );

        Lecture lecture =
                createLecture();

        Comment comment =
                createComment(
                        author.student(),
                        lecture,
                        "Original comment"
                );


        mockMvc.perform(
                        post(
                                "/social/comments/vote/comment/{commentId}",
                                comment.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(
                                                voter.rawToken()
                                        )
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "voteType":"UP"
                                        }
                                        """)
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                );


        assertEquals(
                1,
                commentVoteRepository.count()
        );

        CommentVote vote =
                commentVoteRepository
                        .findAll()
                        .getFirst();

        assertEquals(
                VoteType.UP,
                vote.getVote()
        );


        mockMvc.perform(
                        post(
                                "/social/comments/vote/comment/{commentId}",
                                comment.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(
                                                voter.rawToken()
                                        )
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "voteType":"DOWN"
                                        }
                                        """)
                )
                .andExpect(status().isOk());


        assertEquals(
                1,
                commentVoteRepository.count()
        );


        vote =
                commentVoteRepository
                        .findAll()
                        .getFirst();

        assertEquals(
                VoteType.DOWN,
                vote.getVote()
        );
    }


    @Test
    void answerCreatesNotificationForCommentAuthorAndNotificationCanBeSeen()
            throws Exception {

        Session commentAuthor =
                createSession(
                        "author@student.kit.edu"
                );

        Session answerAuthor =
                createSession(
                        "answerer@student.kit.edu"
                );

        Lecture lecture =
                createLecture();

        Comment comment =
                createComment(
                        commentAuthor.student(),
                        lecture,
                        "Can someone explain this?"
                );


        mockMvc.perform(
                        post("/social/answers")
                                .header(
                                        "Authorization",
                                        bearer(
                                                answerAuthor.rawToken()
                                        )
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "commentID":"%s",
                                          "content":"Here is the explanation"
                                        }
                                        """.formatted(
                                        comment.getId()
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                );


        assertEquals(
                1,
                answerRepository.count()
        );

        assertEquals(
                1,
                notificationRepository.count()
        );


        Notification notification =
                notificationRepository
                        .findAll()
                        .getFirst();


        assertEquals(
                commentAuthor.student().getId(),
                notification
                        .getRecipient()
                        .getId()
        );

        assertFalse(notification.isSeen());


        mockMvc.perform(
                        get("/social/notifications")
                                .header(
                                        "Authorization",
                                        bearer(
                                                commentAuthor.rawToken()
                                        )
                                )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.notifications",
                                hasSize(1))
                )
                .andExpect(
                        jsonPath(
                                "$.notifications[0].type"
                        ).value("ANSWER")
                )
                .andExpect(
                        jsonPath(
                                "$.notifications[0].userName"
                        ).value("answerer")
                )
                .andExpect(
                        jsonPath(
                                "$.notifications[0].content"
                        ).value(
                                "Here is the explanation"
                        )
                );


        mockMvc.perform(
                        patch(
                                "/social/notifications/{notificationId}",
                                notification.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(
                                                commentAuthor.rawToken()
                                        )
                                )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                );


        Notification stored =
                notificationRepository
                        .findById(
                                notification.getId()
                        )
                        .orElseThrow();

        assertTrue(stored.isSeen());


        mockMvc.perform(
                        get("/social/notifications")
                                .header(
                                        "Authorization",
                                        bearer(
                                                commentAuthor.rawToken()
                                        )
                                )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.notifications",
                                hasSize(0))
                );
    }


    @Test
    void studentsCanReportCommentAndAnswer() throws Exception {

        Session author =
                createSession(
                        "author@student.kit.edu"
                );

        Session reporter =
                createSession(
                        "reporter@student.kit.edu"
                );

        Lecture lecture =
                createLecture();

        Comment comment =
                createComment(
                        author.student(),
                        lecture,
                        "Bad comment"
                );


        mockMvc.perform(
                        post("/social/comments/report")
                                .header(
                                        "Authorization",
                                        bearer(
                                                reporter.rawToken()
                                        )
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "commentID":"%s",
                                          "reportReason":"HARASSMENT",
                                          "explanation":"Rude"
                                        }
                                        """.formatted(
                                        comment.getId()
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                );


        assertEquals(
                1,
                commentReportRepository.count()
        );

        assertEquals(
                ReportReason.HARASSMENT,
                commentReportRepository
                        .findAll()
                        .getFirst()
                        .getReason()
        );


        Answer answer =
                createAnswer(
                        author.student(),
                        comment,
                        "Bad answer"
                );


        mockMvc.perform(
                        post("/social/answers/report")
                                .header(
                                        "Authorization",
                                        bearer(
                                                reporter.rawToken()
                                        )
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "answerID":"%s",
                                          "reportReason":"HARASSMENT",
                                          "explanation":"Also rude"
                                        }
                                        """.formatted(
                                        answer.getId()
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                );


        assertEquals(
                1,
                answerReportRepository.count()
        );

        assertEquals(
                ReportReason.HARASSMENT,
                answerReportRepository
                        .findAll()
                        .getFirst()
                        .getReason()
        );
    }


    @Test
    void protectedSocialEndpointsRequireAuthentication() throws Exception {

        mockMvc.perform(
                        post("/social/comments")
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "lectureID":"00000000-0000-0000-0000-000000000001",
                                          "content":"test"
                                        }
                                        """)
                )
                .andExpect(
                        status().isUnauthorized()
                );


        mockMvc.perform(
                        get("/social/notifications")
                )
                .andExpect(
                        status().isUnauthorized()
                );
    }



    private Session createSession(String email) {

        Student student = createStudent(email);

        String raw = TokenGenerator.generateToken();

        Token token = new Token();

        token.setEmail(email);
        token.setStudent(student);

        token.setHash(HashGenerator.hashToken(raw));

        token.setExpiresAt(LocalDateTime.now().plusHours(12));

        token = tokenRepository.saveAndFlush(token);


        return new Session(student, token, raw);
    }


    private Student createStudent(String email) {

        Student student = new Student();

        student.setKitEmail(email);

        student.setUsername(
                email.substring(
                        0,
                        email.indexOf('@')
                )
        );

        student.setCredibilityScore(0);

        student.setStatus(UserStatus.ACTIVE);

        student.setEmailVerifiedAt(LocalDateTime.now());

        return studentRepository.saveAndFlush(student);
    }


    private Lecture createLecture() {

        Lecture lecture = new Lecture();

        lecture.setName("Lineare Algebra 1");
        lecture.setCode("LA1");

        lecture.setSemesterYear(2026);

        lecture.setSemesterSeason(SemesterSeason.SUMMER);

        lecture.setActive(true);

        return lectureRepository.saveAndFlush(lecture);
    }


    private Comment createComment(Student student, Lecture lecture, String content) {

        Comment comment = new Comment();

        comment.setStudent(student);
        comment.setLecture(lecture);
        comment.setContent(content);

        comment.setStatus(ContentStatus.VISIBLE);

        return commentRepository.saveAndFlush(comment);
    }


    private Answer createAnswer(Student student, Comment comment, String content) {

        Answer answer = new Answer();

        answer.setStudent(student);
        answer.setComment(comment);
        answer.setContent(content);

        answer.setStatus(ContentStatus.VISIBLE);

        return answerRepository.saveAndFlush(answer);
    }


    private String bearer(String token) {
        return "Bearer " + token;
    }


    private record Session(
            Student student,
            Token token,
            String rawToken
    ) {
    }
}