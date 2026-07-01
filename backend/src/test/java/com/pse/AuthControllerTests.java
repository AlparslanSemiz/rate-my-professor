package com.pse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pse.auth.controller.AuthController;
import com.pse.auth.dto.request.LoginRequest;
import com.pse.auth.dto.request.OTPRequest;
import com.pse.auth.dto.request.ValidateCredsRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.LoginResponse;
import com.pse.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class AuthControllerTests {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void loginShouldSucceedForValidToken() {
        LoginRequest request = new LoginRequest("test@student.kit.edu", "123456");
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        when(authService.login(request, httpRequest))
                .thenReturn(new LoginResponse("Login successful", true, "auth-token"));

        LoginResponse response = authController.login(request, httpRequest);

        assertTrue(response.success());
        assertEquals("Login successful", response.message());
        assertEquals("auth-token", response.authToken());

        verify(authService).login(request, httpRequest);
    }

    @Test
    void loginShouldCreateStudentIfStudentDoesNotExist() {
        LoginRequest request = new LoginRequest("test@student.kit.edu", "123456");
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        when(authService.login(request, httpRequest))
                .thenReturn(new LoginResponse("Login successful", true, "auth-token"));

        LoginResponse response = authController.login(request, httpRequest);

        assertTrue(response.success());
        assertEquals("Login successful", response.message());
        assertEquals("auth-token", response.authToken());

        verify(authService).login(request, httpRequest);
    }

    @Test
    void loginShouldFailForInvalidToken() {
        LoginRequest request = new LoginRequest("test@student.kit.edu", "wrong");
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        when(authService.login(request, httpRequest))
                .thenReturn(new LoginResponse("Invalid token", false, null));

        LoginResponse response = authController.login(request, httpRequest);

        assertFalse(response.success());
        assertEquals("Invalid token", response.message());
        assertNull(response.authToken());

        verify(authService).login(request, httpRequest);
    }

    @Test
    void loginShouldFailIfEmailIsMissing() {
        LoginRequest request = new LoginRequest(null, "123456");
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        when(authService.login(request, httpRequest))
                .thenReturn(new LoginResponse("Error, Email is required", false, null));

        LoginResponse response = authController.login(request, httpRequest);

        assertFalse(response.success());
        assertEquals("Error, Email is required", response.message());
        assertNull(response.authToken());

        verify(authService).login(request, httpRequest);
    }

    @Test
    void loginShouldFailIfLoginTokenIsMissing() {
        LoginRequest request = new LoginRequest("test@student.kit.edu", null);
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        when(authService.login(request, httpRequest))
                .thenReturn(new LoginResponse("Error, login token is required", false, null));

        LoginResponse response = authController.login(request, httpRequest);

        assertFalse(response.success());
        assertEquals("Error, login token is required", response.message());
        assertNull(response.authToken());

        verify(authService).login(request, httpRequest);
    }

    @Test
    void meShouldRejectInvalidAuthorizationHeader() {
        when(authService.me("invalid-header"))
                .thenReturn(new BasicResponse("Not logged in", false));

        BasicResponse response = authController.me("invalid-header");

        assertFalse(response.success());
        assertEquals("Not logged in", response.message());

        verify(authService).me("invalid-header");
    }

    @Test
    void meShouldRejectWrongBearerToken() {
        when(authService.me("Bearer wrong-token"))
                .thenReturn(new BasicResponse("Not logged in", false));

        BasicResponse response = authController.me("Bearer wrong-token");

        assertFalse(response.success());
        assertEquals("Not logged in", response.message());

        verify(authService).me("Bearer wrong-token");
    }

    @Test
    void meShouldAcceptValidBearerToken() {
        when(authService.me("Bearer auth-token"))
                .thenReturn(new BasicResponse(
                        "Logged in as: test@student.kit.edu",
                        true
                ));

        BasicResponse response = authController.me("Bearer auth-token");

        assertTrue(response.success());
        assertEquals("Logged in as: test@student.kit.edu", response.message());

        verify(authService).me("Bearer auth-token");
    }

    @Test
    void requestLoginShouldRejectNonKitEmail() {
        OTPRequest request = new OTPRequest("test@gmail.com");

        when(authService.requestLogin(request))
                .thenReturn(new BasicResponse(
                        "Email must end with '@student.kit.edu' (was: test@gmail.com)",
                        false
                ));

        BasicResponse response = authController.requestLogin(request);

        assertFalse(response.success());
        assertEquals(
                "Email must end with '@student.kit.edu' (was: test@gmail.com)",
                response.message()
        );

        verify(authService).requestLogin(request);
    }

    @Test
    void requestLoginShouldFailIfEmailIsMissing() {
        OTPRequest request = new OTPRequest(null);

        when(authService.requestLogin(request))
                .thenReturn(new BasicResponse("Error, Email is required", false));

        BasicResponse response = authController.requestLogin(request);

        assertFalse(response.success());
        assertEquals("Error, Email is required", response.message());

        verify(authService).requestLogin(request);
    }

    @Test
    void requestLoginShouldSucceedForKitEmail() {
        OTPRequest request = new OTPRequest("TEST@student.kit.edu");

        when(authService.requestLogin(request))
                .thenReturn(new BasicResponse(
                        "Login Token sent to: test@student.kit.edu",
                        true
                ));

        BasicResponse response = authController.requestLogin(request);

        assertTrue(response.success());
        assertEquals(
                "Login Token sent to: test@student.kit.edu",
                response.message()
        );

        verify(authService).requestLogin(request);
    }

    @Test
    void validateShouldFailWithoutBearerToken() {
        ValidateCredsRequest request =
                new ValidateCredsRequest("test@student.kit.edu");

        when(authService.validate("invalid-header", request))
                .thenReturn(new BasicResponse("Error, no Auth-Token supplied", false));

        BasicResponse response =
                authController.validate("invalid-header", request);

        assertFalse(response.success());
        assertEquals("Error, no Auth-Token supplied", response.message());

        verify(authService).validate("invalid-header", request);
    }

    @Test
    void validateShouldFailForWrongAuthToken() {
        ValidateCredsRequest request =
                new ValidateCredsRequest("test@student.kit.edu");

        when(authService.validate("Bearer wrong-token", request))
                .thenReturn(new BasicResponse("Error, wrong Auth-Token", false));

        BasicResponse response =
                authController.validate("Bearer wrong-token", request);

        assertFalse(response.success());
        assertEquals("Error, wrong Auth-Token", response.message());

        verify(authService).validate("Bearer wrong-token", request);
    }

    @Test
    void validateShouldSucceedForMatchingEmail() {
        ValidateCredsRequest request =
                new ValidateCredsRequest("test@student.kit.edu");

        when(authService.validate("Bearer auth-token", request))
                .thenReturn(new BasicResponse(
                        "Correct auth-Token for email: test@student.kit.edu",
                        true
                ));

        BasicResponse response =
                authController.validate("Bearer auth-token", request);

        assertTrue(response.success());
        assertEquals(
                "Correct auth-Token for email: test@student.kit.edu",
                response.message()
        );

        verify(authService).validate("Bearer auth-token", request);
    }

    @Test
    void validateShouldFailForWrongEmail() {
        ValidateCredsRequest request =
                new ValidateCredsRequest("other@student.kit.edu");

        when(authService.validate("Bearer auth-token", request))
                .thenReturn(new BasicResponse("Error, wrong email for auth Token", false));

        BasicResponse response =
                authController.validate("Bearer auth-token", request);

        assertFalse(response.success());
        assertEquals("Error, wrong email for auth Token", response.message());

        verify(authService).validate("Bearer auth-token", request);
    }
}