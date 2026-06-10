package com.pse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;

import com.pse.request.LoginRequest;
import com.pse.request.OTPRequest;
import com.pse.response.BasicResponse;
import com.pse.response.LoginResponse;

import jakarta.servlet.http.HttpServletRequest;

class AuthControllerTests {

    @Mock
    private MailService mailService;

    @Mock
    private TokenService tokenService;

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

        when(tokenService.createAndSaveAuthToken(
                "test@student.kit.edu"))
                .thenReturn("auth-token");

        LoginResponse response =
                authController.login(request, httpRequest);

        assertTrue(response.success());
        assertEquals("Login successful", response.message());
        assertEquals("auth-token", response.authToken());

        verify(mailService).sendSuccessfulLogin(
                "test@student.kit.edu",
                "127.0.0.1",
                "JUnit Test"
        );
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
                .createAndSaveAuthToken(anyString());

        verify(mailService, never())
                .sendSuccessfulLogin(anyString(), anyString(), anyString());
    }

    @Test
    void meShouldRejectInvalidAuthorizationHeader() {

        BasicResponse response =
                authController.me("invalid-header");

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
}