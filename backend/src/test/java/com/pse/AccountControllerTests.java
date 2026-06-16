package com.pse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;

import com.pse.request.LogoutRequest;
import com.pse.request.ValidateCredsRequest;
import com.pse.response.BasicResponse;

class AccountControllerTests {

    @Mock
    private TokenService tokenService;

    @InjectMocks
    private AccountController accountController;

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
        when(tokenService.verifyAuthToken("auth-token"))
                .thenReturn("test@student.kit.edu");

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
}