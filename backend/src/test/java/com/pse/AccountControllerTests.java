package com.pse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pse.auth.controller.AuthController;
import com.pse.auth.dto.request.ValidateCredsRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.user.controller.AccountController;
import com.pse.user.dto.StudentProfileResponse;
import com.pse.user.service.StudentService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class AccountControllerTests {

    @Mock
    private AuthService authService;

    @Mock
    private StudentService studentService;

    @InjectMocks
    private AccountController accountController;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ---------------- LOGOUT ----------------

    @Test
    void logoutShouldFailWithoutBearerToken() {
        when(studentService.requestLogout("invalid-header"))
                .thenReturn(new BasicResponse("Error, couldnt authenticate user", false));

        BasicResponse response =
                accountController.requestLogout("invalid-header");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());

        verify(studentService).requestLogout("invalid-header");
    }

    @Test
    void logoutShouldFailForWrongAuthToken() {
        when(studentService.requestLogout("Bearer wrong-token"))
                .thenReturn(new BasicResponse("Error, couldnt authenticate user", false));

        BasicResponse response =
                accountController.requestLogout("Bearer wrong-token");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());

        verify(studentService).requestLogout("Bearer wrong-token");
    }

    @Test
    void logoutShouldSucceedForValidToken() {
        when(studentService.requestLogout("Bearer auth-token"))
                .thenReturn(new BasicResponse("Logged out successfully (3 sessions)", true));

        BasicResponse response =
                accountController.requestLogout("Bearer auth-token");

        assertTrue(response.success());
        assertEquals("Logged out successfully (3 sessions)", response.message());

        verify(studentService).requestLogout("Bearer auth-token");
    }

    // ---------------- VALIDATE ----------------

    @Test
    void validateShouldFailWithoutBearerToken() {

        ValidateCredsRequest request =
                new ValidateCredsRequest("test@student.kit.edu");

        when(authService.validate("invalid-header", request))
                .thenReturn(new BasicResponse("Error, no Auth-Token supplied", false));


        BasicResponse response =
                authController.validate(
                        "invalid-header",
                        new ValidateCredsRequest("test@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, no Auth-Token supplied", response.message());
    }

    @Test
    void validateShouldFailForWrongAuthToken() {
        when(authService.validateCredentials(
                "Bearer wrong-token",
                "test@student.kit.edu"
        )).thenReturn(
                new BasicResponse("Error, wrong Auth-Token", false)
        );

        BasicResponse response =
                authController.validate(
                        "Bearer wrong-token",
                        new ValidateCredsRequest("test@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, wrong Auth-Token", response.message());
    }

    @Test
    void validateShouldSucceedForMatchingEmail() {
        when(authService.validateCredentials(
                "Bearer auth-token",
                "test@student.kit.edu"
        )).thenReturn(
                new BasicResponse("Correct auth-Token for email: test@student.kit.edu", true)
        );

        BasicResponse response =
                authController.validate(
                        "Bearer auth-token",
                        new ValidateCredsRequest("test@student.kit.edu")
                );

        assertTrue(response.success());
        assertEquals(
                "Correct auth-Token for email: test@student.kit.edu",
                response.message()
        );
    }

    @Test
    void validateShouldFailForWrongEmail() {
        when(authService.validateCredentials(
                "Bearer auth-token",
                "other@student.kit.edu"
        )).thenReturn(
                new BasicResponse("Error, wrong email for auth Token", false)
        );

        BasicResponse response =
                authController.validate(
                        "Bearer auth-token",
                        new ValidateCredsRequest("other@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, wrong email for auth Token", response.message());
    }

    // ---------------- INFORMATION ----------------

    @Test
    void informationShouldFailWithoutBearerToken() {
        when(studentService.getUserInformation("invalid-header"))
                .thenReturn(new StudentProfileResponse(
                        "Error, cannot authenticate user",
                        false,
                        null,
                        0,
                        0,
                        0,
                        0
                ));

        StudentProfileResponse response =
                accountController.getUserInformation("invalid-header");

        assertFalse(response.success());
        assertEquals("Error, cannot authenticate user", response.message());

        verify(studentService).getUserInformation("invalid-header");
    }

    @Test
    void informationShouldFailForWrongAuthToken() {
        when(studentService.getUserInformation("Bearer wrong-token"))
                .thenReturn(new StudentProfileResponse(
                        "Error, cannot authenticate user",
                        false,
                        null,
                        0,
                        0,
                        0,
                        0
                ));

        StudentProfileResponse response =
                accountController.getUserInformation("Bearer wrong-token");

        assertFalse(response.success());
        assertEquals("Error, cannot authenticate user", response.message());

        verify(studentService).getUserInformation("Bearer wrong-token");
    }

    @Test
    void informationShouldSucceedForValidToken() {
        when(studentService.getUserInformation("Bearer auth-token"))
                .thenReturn(new StudentProfileResponse(
                        "Success",
                        true,
                        "SchnellerFuchs1234",
                        4.5,
                        0,
                        0,
                        42
                ));

        StudentProfileResponse response =
                accountController.getUserInformation("Bearer auth-token");

        assertTrue(response.success());
        assertEquals("Success", response.message());
        assertEquals("SchnellerFuchs1234", response.username());
        assertEquals(4.5, response.averageRating());
        assertEquals(0, response.ratingsCount());
        assertEquals(0, response.commentsWritten());
        assertEquals(42, response.credibilityScore());

        verify(studentService).getUserInformation("Bearer auth-token");
    }

    // ---------------- DELETE ACCOUNT ----------------

    @Test
    void deleteAccountShouldFailWithoutBearerToken() {
        when(studentService.deleteAccount("invalid-header"))
                .thenReturn(new BasicResponse("Error, couldnt authenticate user", false));

        BasicResponse response =
                accountController.deleteAccount("invalid-header");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());

        verify(studentService).deleteAccount("invalid-header");
    }

    @Test
    void deleteAccountShouldFailForWrongAuthToken() {
        when(studentService.deleteAccount("Bearer wrong-token"))
                .thenReturn(new BasicResponse("Error, couldnt authenticate user", false));

        BasicResponse response =
                accountController.deleteAccount("Bearer wrong-token");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());

        verify(studentService).deleteAccount("Bearer wrong-token");
    }

    @Test
    void deleteAccountShouldSucceedForValidToken() {
        when(studentService.deleteAccount("Bearer auth-token"))
                .thenReturn(new BasicResponse(
                        "Deleted Account succesfully: test@student.kit.edu",
                        true
                ));

        BasicResponse response =
                accountController.deleteAccount("Bearer auth-token");

        assertTrue(response.success());
        assertEquals(
                "Deleted Account succesfully: test@student.kit.edu",
                response.message()
        );

        verify(studentService).deleteAccount("Bearer auth-token");
    }
}