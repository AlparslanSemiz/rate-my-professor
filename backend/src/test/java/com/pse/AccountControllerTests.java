package com.pse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pse.auth.controller.AccountController;
import com.pse.auth.controller.AuthController;
import com.pse.auth.dto.request.ValidateCredsRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.TokenService;
import com.pse.user.dto.StudentProfileResponse;
import com.pse.user.model.Student;
import com.pse.user.service.StudentService;

import java.util.ArrayList;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class AccountControllerTests {

    @Mock
    private TokenService tokenService;

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
        when(tokenService.verifyUser("invalid-header"))
                .thenReturn(null);

        BasicResponse response =
                accountController.requestLogout("invalid-header");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());
    }

    @Test
    void logoutShouldFailForWrongAuthToken() {
        when(tokenService.verifyUser("Bearer wrong-token"))
                .thenReturn(null);

        BasicResponse response =
                accountController.requestLogout("Bearer wrong-token");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());
    }

    @Test
    void logoutShouldSucceedForValidToken() {
        Student student = new Student();
        student.setKitEmail("test@student.kit.edu");

        when(tokenService.verifyUser("Bearer auth-token"))
                .thenReturn(student);

        when(tokenService.invalidateAllAuthTokensForEmail("test@student.kit.edu"))
                .thenReturn(3);

        BasicResponse response =
                accountController.requestLogout("Bearer auth-token");

        assertTrue(response.success());
        assertEquals("Logged out successfully (3 sessions)", response.message());

        verify(tokenService)
                .invalidateAllAuthTokensForEmail("test@student.kit.edu");
    }


    @Test
    void validateShouldFailWithoutBearerToken() {
        when(tokenService.validateCredentials(
                "invalid-header",
                "test@student.kit.edu"
        )).thenReturn(
                new BasicResponse("Error, no Auth-Token supplied", false)
        );

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
        when(tokenService.validateCredentials(
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
        when(tokenService.validateCredentials(
                "Bearer auth-token",
                "test@student.kit.edu"
        )).thenReturn(
                new BasicResponse("Success", true)
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
        when(tokenService.validateCredentials(
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


    @Test
    void informationShouldFailWithoutBearerToken() {
        when(tokenService.verifyUser("invalid-header"))
                .thenReturn(null);

        StudentProfileResponse response =
                accountController.getUserInformation("invalid-header");

        assertFalse(response.success());
        assertEquals("Error, cannot authenticate user", response.message());
    }

    @Test
    void informationShouldFailForWrongAuthToken() {
        when(tokenService.verifyUser("Bearer wrong-token"))
                .thenReturn(null);

        StudentProfileResponse response =
                accountController.getUserInformation("Bearer wrong-token");

        assertFalse(response.success());
        assertEquals("Error, cannot authenticate user", response.message());
    }

    @Test
    void informationShouldSucceedForValidToken() {
        Student student = new Student();
        student.setUsername("SchnellerFuchs1234");
        student.setCredibilityScore(42);
        student.setRatings(new ArrayList<>());
        student.setComments(new ArrayList<>());

        when(tokenService.verifyUser("Bearer auth-token"))
                .thenReturn(student);

        when(studentService.getAverageRating(student))
                .thenReturn(4.5);

        StudentProfileResponse response =
                accountController.getUserInformation("Bearer auth-token");

        assertTrue(response.success());
        assertEquals("Success", response.message());
        assertEquals("SchnellerFuchs1234", response.username());
        assertEquals(4.5, response.averageRating());
        assertEquals(0, response.ratingsCount());
        assertEquals(0, response.commentsWritten());
        assertEquals(42, response.credibilityScore());
    }


    @Test
    void deleteAccountShouldFailWithoutBearerToken() {
        when(tokenService.verifyUser("invalid-header"))
                .thenReturn(null);

        BasicResponse response =
                accountController.deleteAccount("invalid-header");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());
    }

    @Test
    void deleteAccountShouldFailForWrongAuthToken() {
        when(tokenService.verifyUser("Bearer wrong-token"))
                .thenReturn(null);

        BasicResponse response =
                accountController.deleteAccount("Bearer wrong-token");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());
    }

    @Test
    void deleteAccountShouldSucceedForValidToken() {
        Student student = new Student();
        student.setKitEmail("test@student.kit.edu");

        when(tokenService.verifyUser("Bearer auth-token"))
                .thenReturn(student);
        when(studentService.softDeleteByKitEmail("test@student.kit.edu"))
                .thenReturn(true);

        BasicResponse response =
                accountController.deleteAccount("Bearer auth-token");

        assertTrue(response.success());
        assertEquals(
                "Deleted Account succesfully: test@student.kit.edu",
                response.message()
        );

        verify(studentService)
                .softDeleteByKitEmail("test@student.kit.edu");
    }
}