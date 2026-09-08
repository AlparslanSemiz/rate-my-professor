package com.pse.social;

import com.pse.audit.model.AuditAction;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.pse.support.ApiIntegrationTest;
import com.pse.support.DatabaseReset;

@ApiIntegrationTest
class SocialApiIntegrationTests {

    @Autowired DatabaseReset databaseReset;

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

        databaseReset.all();








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


        assertThat(commentRepository.count()).isEqualTo(1);

        Comment comment =
                commentRepository
                        .findAll()
                        .getFirst();

        assertThat(comment.getContent()).isEqualTo("Very helpful lecture");

        assertThat(comment.getStudent().getId()).isEqualTo(student.student().getId());

        assertThat(comment.getLecture().getId()).isEqualTo(lecture.getId());


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


    /**
     * F-3 end to end. {@code NONE} is accepted by the boundary -- it is a {@link VoteType}
     * value like the other two, so {@code @NotNull} passes -- and the row is deleted rather
     * than rewritten, which is what lets the {@code vote} column stay {@code nullable = false}.
     *
     * <p>The audit entry is the other half: F-1 means a withdrawal is recorded too, and a
     * withdrawal is the event a manipulation case most needs to see.
     */
    @Test
    void aVoteCanBeWithdrawnAndTheWithdrawalIsRecorded() throws Exception {

        Session author = createSession("author@student.kit.edu");
        Session voter = createSession("voter@student.kit.edu");
        Lecture lecture = createLecture();
        Comment comment = createComment(author.student(), lecture, "Original comment");

        mockMvc.perform(
                        post("/social/comments/vote/comment/{commentId}", comment.getId())
                                .header("Authorization", bearer(voter.rawToken()))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "voteType":"UP"
                                        }
                                        """)
                )
                .andExpect(status().isOk());

        assertThat(commentVoteRepository.count()).isEqualTo(1);

        mockMvc.perform(
                        post("/social/comments/vote/comment/{commentId}", comment.getId())
                                .header("Authorization", bearer(voter.rawToken()))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "voteType":"NONE"
                                        }
                                        """)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(commentVoteRepository.count()).isEqualTo(0);

        assertThat(auditLogRepository.findAll().stream()
                        .filter(log -> log.getAction() == AuditAction.COMMENT_VOTED)
                        .count()).isEqualTo(2);
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


        assertThat(commentVoteRepository.count()).isEqualTo(1);

        CommentVote vote =
                commentVoteRepository
                        .findAll()
                        .getFirst();

        assertThat(vote.getVote()).isEqualTo(VoteType.UP);


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


        assertThat(commentVoteRepository.count()).isEqualTo(1);


        vote =
                commentVoteRepository
                        .findAll()
                        .getFirst();

        assertThat(vote.getVote()).isEqualTo(VoteType.DOWN);
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


        assertThat(answerRepository.count()).isEqualTo(1);

        assertThat(notificationRepository.count()).isEqualTo(1);


        Notification notification =
                notificationRepository
                        .findAll()
                        .getFirst();


        assertThat(notification
                        .getRecipient()
                        .getId()).isEqualTo(commentAuthor.student().getId());

        assertThat(notification.isSeen()).isFalse();


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

        assertThat(stored.isSeen()).isTrue();


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


    /**
     * A null voteType used to reach the vote row and only fail at flush, surfacing as a 409
     * "State conflict" for what is really a malformed request. The @NotNull on the request
     * record now stops it at the boundary. See F-2 in docs/test-findings.md.
     */
    @Test
    void voteWithoutAVoteTypeIsRejectedAsABadRequest() throws Exception {

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
                        "A comment to vote on"
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
                                          "voteType":null
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.success")
                                .value(false)
                )
                .andExpect(
                        jsonPath("$.message")
                                .value("Invalid request")
                );


        // An absent field is the same case as an explicit null.
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
                                .content("{}")
                )
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.message")
                                .value("Invalid request")
                );
    }


    @Test
    void votingOnAnAnswerWithoutAVoteTypeIsRejectedAsABadRequest() throws Exception {

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
                        "A comment"
                );

        Answer answer =
                createAnswer(
                        author.student(),
                        comment,
                        "An answer to vote on"
                );


        mockMvc.perform(
                        post(
                                "/social/comments/vote/answer/{answerId}",
                                answer.getId()
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
                                          "voteType":null
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.message")
                                .value("Invalid request")
                );
    }


    /** The guard must not reject a legitimate vote. */
    @Test
    void aVoteCarryingAVoteTypeIsStillAccepted() throws Exception {

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
                        "A comment to vote on"
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
                )
                .andExpect(
                        jsonPath("$.message")
                                .value("Comment vote saved successfully")
                );
    }


    @Test
    void studentCannotMarkAnotherStudentsNotificationAsSeen() throws Exception {

        Session target =
                createSession(
                        "target@student.kit.edu"
                );

        Session answerAuthor =
                createSession(
                        "answerer@student.kit.edu"
                );

        Session other =
                createSession(
                        "other@student.kit.edu"
                );

        Lecture lecture =
                createLecture();

        Comment comment =
                createComment(
                        target.student(),
                        lecture,
                        "Original comment"
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
                                          "content":"An answer"
                                        }
                                        """.formatted(
                                        comment.getId()
                                ))
                )
                .andExpect(status().isOk());


        Notification notification =
                notificationRepository
                        .findAll()
                        .getFirst();


        mockMvc.perform(
                        patch(
                                "/social/notifications/{notificationId}",
                                notification.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(
                                                other.rawToken()
                                        )
                                )
                )
                .andExpect(status().isNotFound())
                .andExpect(
                        jsonPath("$.success")
                                .value(false)
                );


        assertThat(notificationRepository
                        .findById(
                                notification.getId()
                        )
                        .orElseThrow()
                        .isSeen()).isFalse();


        mockMvc.perform(
                        get("/social/notifications")
                                .header(
                                        "Authorization",
                                        bearer(
                                                target.rawToken()
                                        )
                                )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.notifications",
                                hasSize(1))
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


        assertThat(commentReportRepository.count()).isEqualTo(1);

        assertThat(commentReportRepository
                        .findAll()
                        .getFirst()
                        .getReason()).isEqualTo(ReportReason.HARASSMENT);


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


        assertThat(answerReportRepository.count()).isEqualTo(1);

        assertThat(answerReportRepository
                        .findAll()
                        .getFirst()
                        .getReason()).isEqualTo(ReportReason.HARASSMENT);
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

        lecture.setSemesterSeason(SemesterSeason.SS);

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