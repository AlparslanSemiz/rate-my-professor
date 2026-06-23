package com.pse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pse.auth.controller.AccountController;
import com.pse.auth.service.TokenService;
import com.pse.user.model.Student;
import com.pse.auth.dto.request.LogoutRequest;
import com.pse.auth.dto.request.ValidateCredsRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.user.dto.StudentProfileResponse;

import com.pse.user.service.StudentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Optional;

class AccountControllerTests {

    @Mock
    private TokenService tokenService;


    @InjectMocks
    private AccountController accountController;

    @Mock
    private StudentService studentService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void logoutShouldFailWithoutBearerToken() {
        BasicResponse response =
                accountController.requestLogout(
                        "invalid-header",
                        new LogoutRequest("test@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, no Auth-Token supplied", response.message());
    }

    @Test
    void logoutShouldFailForWrongAuthToken() {
        when(tokenService.verifyAuthToken("wrong-token"))
                .thenReturn(null);

        BasicResponse response =
                accountController.requestLogout(
                        "Bearer wrong-token",
                        new LogoutRequest("test@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, wrong Auth-Token", response.message());
    }

    @Test
    void logoutShouldFailIfEmailIsMissing() {
        BasicResponse response =
                accountController.requestLogout(
                        "Bearer auth-token",
                        new LogoutRequest(null)
                );

        assertFalse(response.success());
        assertEquals("Error, no email supplied", response.message());
    }

    @Test
    void logoutShouldFailForWrongEmail() {
        when(tokenService.verifyAuthToken("auth-token"))
                .thenReturn("test@student.kit.edu");

        BasicResponse response =
                accountController.requestLogout(
                        "Bearer auth-token",
                        new LogoutRequest("other@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, wrong email for auth Token", response.message());
    }

    @Test
    void logoutShouldSucceedForValidTokenAndEmail() {
        when(tokenService.verifyAuthToken("auth-token"))
                .thenReturn("test@student.kit.edu");

        when(tokenService.invalidateAllAuthTokensForEmail("test@student.kit.edu"))
                .thenReturn(3);

        BasicResponse response =
                accountController.requestLogout(
                        "Bearer auth-token",
                        new LogoutRequest("test@student.kit.edu")
                );

        assertTrue(response.success());
        assertEquals("Logged out successfully (3 sessions)", response.message());

        verify(tokenService)
                .invalidateAllAuthTokensForEmail("test@student.kit.edu");
    }

    @Test
    void validateShouldFailWithoutBearerToken() {
        BasicResponse response =
                accountController.validate(
                        "invalid-header",
                        new ValidateCredsRequest("test@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, not logged in", response.message());
    }

    @Test
    void validateShouldFailForWrongAuthToken() {
        when(tokenService.verifyAuthToken("wrong-token"))
                .thenReturn(null);

        BasicResponse response =
                accountController.validate(
                        "Bearer wrong-token",
                        new ValidateCredsRequest("test@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, wrong Auth-Token", response.message());
    }

    @Test
    void validateShouldSucceedForMatchingEmail() {
        when(tokenService.verifyAuthToken("auth-token"))
                .thenReturn("test@student.kit.edu");

        BasicResponse response =
                accountController.validate(
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
        when(tokenService.verifyAuthToken("auth-token"))
                .thenReturn("test@student.kit.edu");

        BasicResponse response =
                accountController.validate(
                        "Bearer auth-token",
                        new ValidateCredsRequest("other@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals(
                "Error, wrong email: other@student.kit.edu",
                response.message()
        );
    }

    @Test
    void informationShouldFailWithoutBearerToken() {
        StudentProfileResponse response =
                accountController.getUserInformation(
                        "invalid-header",
                        new LogoutRequest("test@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, no Auth-Token supplied", response.message());
    }

    @Test
    void informationShouldFailIfEmailIsMissing() {
        StudentProfileResponse response =
                accountController.getUserInformation(
                        "Bearer auth-token",
                        new LogoutRequest(null)
                );

        assertFalse(response.success());
        assertEquals("Error, no email supplied", response.message());
    }

    @Test
    void informationShouldFailForWrongAuthToken() {
        when(tokenService.verifyAuthToken("wrong-token"))
                .thenReturn(null);

        StudentProfileResponse response =
                accountController.getUserInformation(
                        "Bearer wrong-token",
                        new LogoutRequest("test@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, wrong Auth-Token", response.message());
    }

    @Test
    void informationShouldFailForWrongEmail() {
        when(tokenService.verifyAuthToken("auth-token"))
                .thenReturn("test@student.kit.edu");

        StudentProfileResponse response =
                accountController.getUserInformation(
                        "Bearer auth-token",
                        new LogoutRequest("other@student.kit.edu")
                );

        assertFalse(response.success());
        assertEquals("Error, wrong email for auth Token", response.message());
    }

    @Test
    void informationShouldSucceedForValidTokenAndEmail() {
        Student student = new Student();
        student.setUsername("SchnellerFuchs1234");
        student.setCredibilityScore(42);

        when(tokenService.verifyAuthToken("auth-token"))
                .thenReturn("test@student.kit.edu");

        when(studentService.findByKitEmail("test@student.kit.edu"))
                .thenReturn(Optional.of(student));

        StudentProfileResponse response =
                accountController.getUserInformation(
                        "Bearer auth-token",
                        new LogoutRequest("test@student.kit.edu")
                );

        assertTrue(response.success());
        assertEquals("Success", response.message());
        assertEquals("SchnellerFuchs1234", response.username());
        assertEquals(42, response.credibilityScore());
        assertEquals(0, response.commentsWritten());
        assertEquals(0, response.ratingsCount());
    }

    @Test
    void deleteAccountShouldSucceedForValidTokenAndEmail() {
        when(tokenService.verifyAuthToken("auth-token"))
                .thenReturn("test@student.kit.edu");

        BasicResponse response =
                accountController.deleteAccount(
                        "Bearer auth-token",
                        new LogoutRequest("test@student.kit.edu")
                );

        assertTrue(response.success());
        assertEquals(
                "Deleted Account succesfully: test@student.kit.edu",
                response.message()
        );

        verify(studentService).softDeleteByKitEmail("test@student.kit.edu");
    }
}