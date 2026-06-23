package com.pse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pse.auth.controller.AuthController;
import com.pse.auth.service.MailService;
import com.pse.auth.service.TokenService;
import com.pse.user.model.Student;
import com.pse.auth.dto.request.LoginRequest;
import com.pse.auth.dto.request.OTPRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.LoginResponse;

import com.pse.user.service.StudentService;
import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

class AuthControllerTests {

    @Mock
    private MailService mailService;

    @Mock
    private TokenService tokenService;


    @Mock
    private StudentService studentService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void loginShouldSucceedForValidToken() {
        LoginRequest request =
                new LoginRequest("test@student.kit.edu", "123456");

        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        when(httpRequest.getHeader("X-Forwarded-For"))
                .thenReturn(null);

        when(httpRequest.getRemoteAddr())
                .thenReturn("127.0.0.1");

        when(httpRequest.getHeader("User-Agent"))
                .thenReturn("JUnit Test");

        when(tokenService.verifyOTToken(
                "test@student.kit.edu",
                "123456"))
                .thenReturn(true);

        Student student = new Student();
        student.setKitEmail("test@student.kit.edu");
        student.setUsername("SchnellerFuchs1234");

        when(studentService.findByKitEmail("test@student.kit.edu"))
                .thenReturn(Optional.of(student));

        when(tokenService.createAndSaveAuthToken(student))
                .thenReturn("auth-token");

        LoginResponse response =
                authController.login(request, httpRequest);

        assertTrue(response.success());
        assertEquals("Login successful", response.message());
        assertEquals("auth-token", response.authToken());

        verify(tokenService).consumeOTP("test@student.kit.edu", "123456");

        verify(mailService).sendSuccessfulLogin(
                "test@student.kit.edu",
                "127.0.0.1",
                "JUnit Test"
        );
    }

    @Test
    void loginShouldCreateStudentIfStudentDoesNotExist() {
        LoginRequest request =
                new LoginRequest("test@student.kit.edu", "123456");

        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        when(httpRequest.getHeader("X-Forwarded-For"))
                .thenReturn(null);

        when(httpRequest.getRemoteAddr())
                .thenReturn("127.0.0.1");

        when(httpRequest.getHeader("User-Agent"))
                .thenReturn("JUnit Test");

        when(tokenService.verifyOTToken(
                "test@student.kit.edu",
                "123456"))
                .thenReturn(true);

        when(studentService.findByKitEmail("test@student.kit.edu"))
                .thenReturn(null);

        when(tokenService.createAndSaveAuthToken(any(Student.class)))
                .thenReturn("auth-token");

        LoginResponse response =
                authController.login(request, httpRequest);

        assertTrue(response.success());
        assertEquals("Login successful", response.message());
        assertEquals("auth-token", response.authToken());

        verify(studentService).addStudent(any(Student.class));
        verify(tokenService).consumeOTP("test@student.kit.edu", "123456");
        verify(tokenService).createAndSaveAuthToken(any(Student.class));
    }

    @Test
    void loginShouldFailForInvalidToken() {
        LoginRequest request =
                new LoginRequest("test@student.kit.edu", "wrong");

        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        when(tokenService.verifyOTToken(
                "test@student.kit.edu",
                "wrong"))
                .thenReturn(false);

        LoginResponse response =
                authController.login(request, httpRequest);

        assertFalse(response.success());
        assertEquals("Invalid token", response.message());
        assertNull(response.authToken());

        verify(tokenService, never())
                .createAndSaveAuthToken(any(Student.class));

        verify(mailService, never())
                .sendSuccessfulLogin(anyString(), anyString(), anyString());
    }

    @Test
    void loginShouldFailIfEmailIsMissing() {
        LoginRequest request =
                new LoginRequest(null, "123456");

        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        LoginResponse response =
                authController.login(request, httpRequest);

        assertFalse(response.success());
        assertEquals("Error, Email is required", response.message());
        assertNull(response.authToken());
    }

    @Test
    void loginShouldFailIfLoginTokenIsMissing() {
        LoginRequest request =
                new LoginRequest("test@student.kit.edu", null);

        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        LoginResponse response =
                authController.login(request, httpRequest);

        assertFalse(response.success());
        assertEquals("Error, login token is required", response.message());
        assertNull(response.authToken());
    }

    @Test
    void meShouldRejectInvalidAuthorizationHeader() {
        BasicResponse response =
                authController.me("invalid-header");

        assertFalse(response.success());
        assertEquals("Not logged in", response.message());
    }

    @Test
    void meShouldRejectWrongBearerToken() {
        when(tokenService.verifyAuthToken("wrong-token"))
                .thenReturn(null);

        BasicResponse response =
                authController.me("Bearer wrong-token");

        assertFalse(response.success());
        assertEquals("Not logged in", response.message());
    }

    @Test
    void meShouldAcceptValidBearerToken() {
        when(tokenService.verifyAuthToken("auth-token"))
                .thenReturn("test@student.kit.edu");

        BasicResponse response =
                authController.me("Bearer auth-token");

        assertTrue(response.success());
        assertEquals(
                "Logged in as: test@student.kit.edu",
                response.message()
        );
    }

    @Test
    void requestLoginShouldRejectNonKitEmail() {
        OTPRequest request =
                new OTPRequest("test@gmail.com");

        BasicResponse response =
                authController.requestLogin(request);

        assertFalse(response.success());

        assertEquals(
                "Email must end with '@student.kit.edu' (was: test@gmail.com)",
                response.message()
        );

        verify(tokenService, never())
                .createAndSaveOTToken(anyString());

        verify(mailService, never())
                .sendLoginMail(anyString(), anyString());
    }

    @Test
    void requestLoginShouldFailIfEmailIsMissing() {
        OTPRequest request =
                new OTPRequest(null);

        BasicResponse response =
                authController.requestLogin(request);

        assertFalse(response.success());
        assertEquals("Error, Email is required", response.message());

        verify(tokenService, never())
                .createAndSaveOTToken(anyString());

        verify(mailService, never())
                .sendLoginMail(anyString(), anyString());
    }

    @Test
    void requestLoginShouldSucceedForKitEmail() {
        OTPRequest request =
                new OTPRequest("TEST@student.kit.edu");

        when(tokenService.createAndSaveOTToken("test@student.kit.edu"))
                .thenReturn("otp-token");

        BasicResponse response =
                authController.requestLogin(request);

        assertTrue(response.success());
        assertEquals(
                "Login Token sent to: test@student.kit.edu",
                response.message()
        );

        verify(tokenService)
                .createAndSaveOTToken("test@student.kit.edu");

        verify(mailService)
                .sendLoginMail("test@student.kit.edu", "otp-token");
    }
}