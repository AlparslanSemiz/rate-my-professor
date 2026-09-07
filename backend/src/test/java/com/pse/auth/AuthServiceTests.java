package com.pse.auth;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.auth.dto.request.LoginRequest;
import com.pse.auth.dto.request.OTPRequest;
import com.pse.auth.dto.request.ValidateCredentialsRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.LoginResponse;
import com.pse.auth.exception.InvalidAuthTokenException;
import com.pse.auth.model.SessionType;
import com.pse.auth.model.Token;
import com.pse.auth.repository.TokenRepository;
import com.pse.auth.service.*;
import com.pse.moderation.repository.AdminRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.security.TokenAuthenticationService;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.error.ApiException;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.context.ApplicationEventPublisher;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private TokenRepository tokenRepository;

    @Mock
    private OtpService otpService;

    @Mock
    private RateLimitService rateLimitService;

    @Mock
    private LoginCodeDelivery loginCodeDelivery;

    @Mock
    private AdminBootstrapPolicy bootstrapPolicy;

    @Mock
    private AdminSuperuserPolicy superuserPolicy;

    @Mock
    private AuditWriter auditWriter;

    @Mock
    private TokenAuthenticationService tokenAuthenticationService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private HttpServletRequest httpRequest;


    private AuthService authService;


    @BeforeEach
    void setUp() {

        Clock clock = Clock.fixed(Instant.parse("2026-09-05T12:00:00Z"), ZoneOffset.UTC);

        authService = new AuthService(
                        studentRepository,
                        adminRepository,
                        tokenRepository,
                        otpService,
                        rateLimitService,
                        loginCodeDelivery,
                        bootstrapPolicy,
                        superuserPolicy,
                        auditWriter,
                        tokenAuthenticationService,
                        eventPublisher,
                        clock,
                        Duration.ofDays(1),
                        Duration.ofDays(365),
                        3,
                        20,
                        10,
                        30
                );
    }



    @Test
    void requestLoginNormalizesEmailAndSendsCode() {

        OTPRequest request = mock(OTPRequest.class);

        when(request.email())
                .thenReturn("  TEST@STUDENT.KIT.EDU ");

        when(httpRequest.getRemoteAddr())
                .thenReturn("127.0.0.1");

        when(rateLimitService.emailSubject("test@student.kit.edu"))
                .thenReturn("email-subject");

        when(rateLimitService.ipSubject("127.0.0.1"))
                .thenReturn("ip-subject");

        when(studentRepository.findByKitEmail("test@student.kit.edu"))
                .thenReturn(Optional.empty());

        when(otpService.issue("test@student.kit.edu"))
                .thenReturn("ABC234");


        BasicResponse response = authService.requestLogin(request, httpRequest);


        assertTrue(response.success());

        assertEquals("Login code sent", response.message());


        verify(rateLimitService).consume(
                        RateLimitService.REQUEST_CODE,
                        "email-subject",
                        3
                );

        verify(rateLimitService).consume(
                        RateLimitService.REQUEST_CODE,
                        "ip-subject",
                        20
                );

        verify(otpService).issue(
                        "test@student.kit.edu"
                );

        verify(loginCodeDelivery).send(
                        "test@student.kit.edu",
                        "ABC234"
                );
    }


    @Test
    void requestLoginDoesNotSendCodeForBlockedStudent() {

        OTPRequest request = mock(OTPRequest.class);

        Student student = mock(Student.class);

        when(request.email())
                .thenReturn("blocked@student.kit.edu");

        when(httpRequest.getRemoteAddr())
                .thenReturn("127.0.0.1");

        when(rateLimitService.emailSubject(anyString()))
                .thenReturn("email");

        when(rateLimitService.ipSubject(anyString()))
                .thenReturn("ip");

        when(studentRepository.findByKitEmail("blocked@student.kit.edu"))
                .thenReturn(
                Optional.of(student)
        );

        when(student.getStatus())
                .thenReturn(UserStatus.BLOCKED);


        BasicResponse response = authService.requestLogin(request, httpRequest);

        assertTrue(response.success());

        assertEquals(
                "Login code sent",
                response.message()
        );


        verify(otpService, never()).issue(anyString());

        verifyNoInteractions(loginCodeDelivery);
    }


    @Test
    void requestLoginInvalidatesCodeWhenDeliveryFails() {

        OTPRequest request = mock(OTPRequest.class);

        when(request.email())
                .thenReturn("student@student.kit.edu");

        when(httpRequest.getRemoteAddr())
                .thenReturn("127.0.0.1");

        when(rateLimitService.emailSubject(anyString()))
                .thenReturn("email");

        when(rateLimitService.ipSubject(anyString()))
                .thenReturn("ip");

        when(studentRepository.findByKitEmail(anyString()))
                .thenReturn(Optional.empty());

        when(otpService.issue("student@student.kit.edu"))
                .thenReturn("ABC234");

        doThrow(
                new RuntimeException("mail failed")
        )
                .when(loginCodeDelivery)
                .send(
                        "student@student.kit.edu",
                        "ABC234"
                );


        assertThrows(ApiException.class, () -> authService.requestLogin(
                        request,
                        httpRequest
                )
        );


        verify(otpService).invalidate("student@student.kit.edu");
    }



    @Test
    void loginReturnsErrorWhenCodeIsInvalid() {

        LoginRequest request = mock(LoginRequest.class);

        when(request.email())
                .thenReturn("student@student.kit.edu");

        when(request.loginToken())
                .thenReturn("wrong");

        when(httpRequest.getRemoteAddr())
                .thenReturn("127.0.0.1");

        when(rateLimitService.emailSubject(anyString()))
                .thenReturn("email");

        when(rateLimitService.ipSubject(anyString()))
                .thenReturn("ip");

        when(studentRepository.findByKitEmail("student@student.kit.edu"))
                .thenReturn(Optional.empty());

        when(otpService.consume("student@student.kit.edu", "wrong"))
                .thenReturn(false);


        assertThrows(
                ApiException.class,
                () -> authService.login(
                        request,
                        httpRequest
                )
        );


        verify(rateLimitService).consume(
                        RateLimitService.LOGIN_FAILURE,
                        "email",
                        10
                );

        verify(rateLimitService).consume(
                        RateLimitService.LOGIN_FAILURE,
                        "ip",
                        30
                );

        verify(tokenRepository, never()).save(any());
    }


    @Test
    void blockedStudentCannotLogin() {

        LoginRequest request = mock(LoginRequest.class);

        Student student = mock(Student.class);

        when(request.email())
                .thenReturn("blocked@student.kit.edu");

        when(request.loginToken())
                .thenReturn("ABC234");

        when(httpRequest.getRemoteAddr())
                .thenReturn("127.0.0.1");

        when(rateLimitService.emailSubject(anyString()))
                .thenReturn("email");

        when(rateLimitService.ipSubject(anyString()))
                .thenReturn("ip");

        when(studentRepository.findByKitEmail("blocked@student.kit.edu"))
                .thenReturn(
                Optional.of(student)
        );

        when(student.getStatus())
                .thenReturn(UserStatus.BLOCKED);

        when(adminRepository.findByStudent(student))
                .thenReturn(Optional.empty());


        assertThrows(
                ApiException.class,
                () -> authService.login(
                        request,
                        httpRequest
                )
        );


        verify(otpService, never()).consume(anyString(), anyString());

        verify(rateLimitService).consume(
                        RateLimitService.LOGIN_FAILURE,
                        "email",
                        10
                );

        verify(auditWriter).writeRefusal(
                        eq(student),
                        eq(false),
                        eq(AuditAction.LOGIN_REFUSED),
                        eq(AuditTargetType.USER_SESSION),
                        isNull(),
                        anyString(),
                        anyMap()
                );
    }


    @Test
    void loginExistingStudentCreatesSession() {

        LoginRequest request = mock(LoginRequest.class);

        Student student = mock(Student.class);

        UUID studentId = UUID.randomUUID();

        when(request.email())
                .thenReturn("student@student.kit.edu");

        when(request.loginToken())
                .thenReturn(" ABC234 ");

        when(request.sessionType())
                .thenReturn(null);

        when(httpRequest.getRemoteAddr())
                .thenReturn("127.0.0.1");

        when(httpRequest.getHeader("User-Agent"))
                .thenReturn("JUnit");

        when(rateLimitService.emailSubject(anyString()))
                .thenReturn("email");

        when(rateLimitService.ipSubject(anyString()))
                .thenReturn("ip");

        when(studentRepository.findByKitEmail("student@student.kit.edu"))
                .thenReturn(
                Optional.of(student)
        );

        when(student.getId())
                .thenReturn(studentId);

        when(student.getStatus())
                .thenReturn(UserStatus.ACTIVE);

        when(student.getUsername())
                .thenReturn("student");

        when(adminRepository.findByStudent(student))
                .thenReturn(Optional.empty());

        when(bootstrapPolicy.shouldBootstrap("student@student.kit.edu"))
                .thenReturn(false);

        when(otpService.consume("student@student.kit.edu", "ABC234"))
                .thenReturn(true);

        when(tokenRepository.save(any(Token.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );


        LoginResponse response = authService.login(
                        request,
                        httpRequest
                );


        assertTrue(response.success());

        assertEquals(
                "Login successful",
                response.message()
        );

        assertNotNull(response.authToken());


        verify(studentRepository).save(student);


        verify(tokenRepository).save(
                        argThat(token ->
                                token.getStudent() == student
                                        && token.getSessionType()
                                        == SessionType.APP
                                        && !token.isRevoked()
                        )
                );


        verify(rateLimitService).reset(
                        RateLimitService.LOGIN_FAILURE,
                        "email"
                );


        verify(auditWriter).writeStudentAction(
                        eq(student),
                        eq(AuditAction.USER_LOGIN),
                        eq(AuditTargetType.USER_SESSION),
                        nullable(UUID.class),
                        eq("student session"),
                        anyMap()
                );


        verify(eventPublisher).publishEvent(any(SuccessfulLoginEvent.class));
    }



    @Test
    void logoutRevokesCurrentStudentToken() {

        AuthenticatedUser principal = mock(AuthenticatedUser.class);

        Student student = mock(Student.class);

        Token token = mock(Token.class);

        when(principal.token())
                .thenReturn(token);

        when(principal.student())
                .thenReturn(student);

        when(principal.isAdmin())
                .thenReturn(false);

        when(token.isRevoked())
                .thenReturn(false);

        when(student.getUsername())
                .thenReturn("student");


        BasicResponse response =
                authService.logout(principal);


        assertTrue(response.success());

        assertEquals(
                "Logged out successfully",
                response.message()
        );


        verify(token).setRevoked(true);

        verify(tokenRepository).save(token);

        verify(auditWriter).writeStudentAction(
                        eq(student),
                        eq(AuditAction.USER_LOGOUT),
                        eq(AuditTargetType.USER_SESSION),
                        nullable(UUID.class),
                        eq("student session"),
                        anyMap()
                );
    }


    @Test
    void logoutDoesNotSaveAlreadyRevokedTokenAgain() {

        AuthenticatedUser principal = mock(AuthenticatedUser.class);

        Token token = mock(Token.class);

        when(principal.token())
                .thenReturn(token);

        when(token.isRevoked())
                .thenReturn(true);


        BasicResponse response = authService.logout(principal);


        assertTrue(response.success());

        verify(token, never()).setRevoked(anyBoolean());

        verify(tokenRepository, never()).save(any());

        verifyNoInteractions(auditWriter);
    }



    @Test
    void logoutAllRevokesAllActiveTokens() {

        AuthenticatedUser principal = mock(AuthenticatedUser.class);

        Student student = mock(Student.class);

        Token currentToken = mock(Token.class);

        Token secondToken = mock(Token.class);

        Token alreadyRevoked = mock(Token.class);


        when(principal.student())
                .thenReturn(student);

        when(principal.token())
                .thenReturn(currentToken);

        when(principal.isAdmin())
                .thenReturn(false);

        when(student.getKitEmail())
                .thenReturn(
                        "student@student.kit.edu"
                );

        when(student.getUsername())
                .thenReturn("student");

        when(currentToken.isRevoked())
                .thenReturn(false);

        when(secondToken.isRevoked())
                .thenReturn(false);

        when(alreadyRevoked.isRevoked())
                .thenReturn(true);


        List<Token> tokens = List.of(
                        currentToken,
                        secondToken,
                        alreadyRevoked
                );

        when(tokenRepository.findByStudentOrEmail(student, "student@student.kit.edu"))
                .thenReturn(tokens);


        BasicResponse response = authService.logoutAll(principal);


        assertTrue(response.success());

        assertEquals(
                "Logged out from all devices (2 sessions)",
                response.message()
        );


        verify(currentToken).setRevoked(true);

        verify(secondToken).setRevoked(true);

        verify(alreadyRevoked, never()).setRevoked(true);

        verify(tokenRepository).saveAll(tokens);
    }



    @Test
    void validateReturnsSuccessForMatchingTokenAndEmail() {

        ValidateCredentialsRequest request = mock(ValidateCredentialsRequest.class);

        AuthenticatedUser principal = mock(AuthenticatedUser.class);

        Student student = mock(Student.class);


        when(request.email())
                .thenReturn("student@student.kit.edu");

        when(student.getKitEmail())
                .thenReturn("student@student.kit.edu");

        when(principal.student())
                .thenReturn(student);

        when(tokenAuthenticationService.authenticate("secret-token"))
                .thenReturn(
                        Optional.of(principal)
                );


        BasicResponse response = authService.validate(
                        "Bearer secret-token",
                        request
                );


        assertTrue(response.success());

        assertEquals(
                "Correct auth-Token for email: "
                        + "student@student.kit.edu",
                response.message()
        );
    }


    @Test
    void validateReturnsErrorWhenEmailDoesNotMatchToken() {

        ValidateCredentialsRequest request = mock(ValidateCredentialsRequest.class);

        AuthenticatedUser principal = mock(AuthenticatedUser.class);

        Student student = mock(Student.class);


        when(request.email())
                .thenReturn(
                        "other@student.kit.edu"
                );

        when(student.getKitEmail())
                .thenReturn(
                        "student@student.kit.edu"
                );

        when(principal.student())
                .thenReturn(student);

        when(tokenAuthenticationService.authenticate("secret-token"))
                .thenReturn(
                        Optional.of(principal)
                );


        BasicResponse response = authService.validate("Bearer secret-token", request);


        assertFalse(response.success());

        assertEquals(
                "Error, wrong email for auth Token",
                response.message()
        );
    }


    @Test
    void verifyUserRejectsMissingBearerHeader() {

        assertThrows(
                InvalidAuthTokenException.class,
                () -> authService.verifyUser(
                        "secret-token"
                )
        );
    }



    @Test
    void invalidateAllAuthTokensForEmailRevokesEveryToken() {

        Token first = mock(Token.class);

        Token second = mock(Token.class);

        List<Token> tokens = List.of(first, second);

        when(tokenRepository.findByEmail("student@student.kit.edu"))
                .thenReturn(tokens);


        int result = authService.invalidateAllAuthTokensForEmail("student@student.kit.edu");


        assertEquals(2, result);

        verify(first).setRevoked(true);

        verify(second).setRevoked(true);

        verify(tokenRepository).saveAll(tokens);
    }
}