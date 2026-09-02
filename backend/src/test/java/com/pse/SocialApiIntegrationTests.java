package com.pse;

import com.pse.audit.repository.AuditLogRepository;
import com.pse.auth.model.Token;
import com.pse.auth.repository.TokenRepository;
import com.pse.auth.service.TokenGenerator;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.shared.enums.ContentStatus;
import com.pse.shared.enums.SemesterSeason;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.util.HashGenerator;
import com.pse.social.model.Comment;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.social.repository.NotificationRepository;
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
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.pse.moderation.repository.AdminRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({
        TestDeliveryConfig.class,
        com.pse.support.TestGitLabConfig.class
})
class SocialApiIntegrationTests {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    TokenRepository tokenRepository;

    @Autowired
    LectureRepository lectureRepository;

    @Autowired
    CommentRepository commentRepository;

    @Autowired
    AnswerRepository answerRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    AuditLogRepository auditLogRepository;

    @Autowired
    AdminRepository adminRepository;


    @BeforeEach
    void cleanDatabase() {
        auditLogRepository.deleteAll();
        notificationRepository.deleteAll();
        answerRepository.deleteAll();
        commentRepository.deleteAll();
        tokenRepository.deleteAll();

        adminRepository.deleteAll();

        lectureRepository.deleteAll();
        studentRepository.deleteAll();
    }


    @Test
    void answerNotificationIsDeliveredToStudent() throws Exception {
        Session target = createSession("target@student.kit.edu");
        Session author = createSession("author@student.kit.edu");

        Lecture lecture = createLecture();

        Comment comment = createComment(
                target.student(),
                lecture,
                "The exercises were very helpful."
        );

        mockMvc.perform(post("/social/answers")
                        .header("Authorization", bearer(author.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "commentID": "%s",
                                  "content": "I agree, especially the last exercise."
                                }
                                """.formatted(comment.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/social/notifications")
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.notifications", hasSize(1)))
                .andExpect(jsonPath("$.notifications[0].notificationID").exists())
                .andExpect(jsonPath("$.notifications[0].type").value("ANSWER"))
                .andExpect(jsonPath("$.notifications[0].lectureResponse").exists())
                .andExpect(jsonPath("$.notifications[0].lectureResponse.id")
                        .value(lecture.getId().toString()))
                .andExpect(jsonPath("$.notifications[0].lectureResponse.name")
                        .value("Algorithms"))
                .andExpect(jsonPath("$.notifications[0].ownCommentID")
                        .value(comment.getId().toString()))
                .andExpect(jsonPath("$.notifications[0].userName")
                        .value("author"))
                .andExpect(jsonPath("$.notifications[0].content")
                        .value("I agree, especially the last exercise."))
                .andExpect(jsonPath("$.notifications[0].message").isEmpty())
                .andExpect(jsonPath("$.notifications[0].createdAt").exists());
    }


    @Test
    void singleNotificationCanBeMarkedAsSeen() throws Exception {
        Session target = createSession("target@student.kit.edu");
        Session author = createSession("author@student.kit.edu");

        Lecture lecture = createLecture();

        Comment comment = createComment(
                target.student(),
                lecture,
                "Original comment"
        );

        createAnswer(author, comment, "An answer");

        String notifications = mockMvc.perform(get("/social/notifications")
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifications", hasSize(1)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String notificationId =
                com.jayway.jsonpath.JsonPath.read(
                        notifications,
                        "$.notifications[0].notificationID"
                );

        mockMvc.perform(patch(
                        "/social/notifications/{notification_id}",
                        notificationId
                )
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/social/notifications")
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifications", hasSize(0)));
    }


    @Test
    void studentCannotMarkAnotherStudentsNotificationAsSeen() throws Exception {
        Session target = createSession("target@student.kit.edu");
        Session author = createSession("author@student.kit.edu");
        Session other = createSession("other@student.kit.edu");

        Lecture lecture = createLecture();

        Comment comment = createComment(
                target.student(),
                lecture,
                "Original comment"
        );

        createAnswer(author, comment, "An answer");

        String notifications = mockMvc.perform(get("/social/notifications")
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String notificationId =
                com.jayway.jsonpath.JsonPath.read(
                        notifications,
                        "$.notifications[0].notificationID"
                );

        mockMvc.perform(patch(
                        "/social/notifications/{notification_id}",
                        notificationId
                )
                        .header("Authorization", bearer(other.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/social/notifications")
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifications", hasSize(1)));
    }


    @Test
    void allNotificationsCanBeMarkedAsSeen() throws Exception {
        Session target = createSession("target@student.kit.edu");
        Session author = createSession("author@student.kit.edu");

        Lecture lecture = createLecture();

        Comment firstComment = createComment(
                target.student(),
                lecture,
                "First comment"
        );

        Comment secondComment = createComment(
                target.student(),
                lecture,
                "Second comment"
        );

        createAnswer(author, firstComment, "First answer");
        createAnswer(author, secondComment, "Second answer");

        mockMvc.perform(get("/social/notifications")
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifications", hasSize(2)));

        mockMvc.perform(patch("/social/notifications/all")
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/social/notifications")
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifications", hasSize(0)));
    }


    private void createAnswer(
            Session author,
            Comment comment,
            String content
    ) throws Exception {

        mockMvc.perform(post("/social/answers")
                        .header("Authorization", bearer(author.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "commentID": "%s",
                                  "content": "%s"
                                }
                                """.formatted(comment.getId(), content)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }


    private Comment createComment(
            Student student,
            Lecture lecture,
            String content
    ) {
        Comment comment = new Comment();
        comment.setStudent(student);
        comment.setLecture(lecture);
        comment.setContent(content);
        comment.setStatus(ContentStatus.VISIBLE);

        return commentRepository.saveAndFlush(comment);
    }


    private Session createSession(String email) {
        Student student = createStudent(email);

        String rawToken = TokenGenerator.generateToken();

        Token token = new Token();
        token.setEmail(email);
        token.setStudent(student);
        token.setHash(HashGenerator.hashToken(rawToken));
        token.setExpiresAt(LocalDateTime.now().plusHours(12));

        tokenRepository.saveAndFlush(token);

        return new Session(student, rawToken);
    }


    private Student createStudent(String email) {
        Student student = new Student();
        student.setKitEmail(email);
        student.setUsername(email.substring(0, email.indexOf('@')));
        student.setCredibilityScore(0);
        student.setStatus(UserStatus.ACTIVE);
        student.setEmailVerifiedAt(LocalDateTime.now());

        return studentRepository.saveAndFlush(student);
    }


    private Lecture createLecture() {
        Lecture lecture = new Lecture();
        lecture.setName("Algorithms");
        lecture.setCode("CS101");
        lecture.setSemesterYear(2026);
        lecture.setSemesterSeason(SemesterSeason.SUMMER);
        lecture.setActive(true);

        return lectureRepository.saveAndFlush(lecture);
    }


    private String bearer(String token) {
        return "Bearer " + token;
    }


    private record Session(
            Student student,
            String rawToken
    ) {
    }
}