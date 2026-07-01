package com.pse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pse.auth.dto.response.BasicResponse;
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
    private StudentService studentService;

    @InjectMocks
    private AccountController accountController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void logoutShouldFailWithoutBearerToken() {
        when(studentService.requestLogout("invalid-header"))
                .thenReturn(new BasicResponse("Error, couldnt authenticate user", false));

        BasicResponse response = accountController.requestLogout("invalid-header");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());

        verify(studentService).requestLogout("invalid-header");
    }

    @Test
    void logoutShouldFailForWrongAuthToken() {
        when(studentService.requestLogout("Bearer wrong-token"))
                .thenReturn(new BasicResponse("Error, couldnt authenticate user", false));

        BasicResponse response = accountController.requestLogout("Bearer wrong-token");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());

        verify(studentService).requestLogout("Bearer wrong-token");
    }

    @Test
    void logoutShouldSucceedForValidToken() {
        when(studentService.requestLogout("Bearer auth-token"))
                .thenReturn(new BasicResponse("Logged out successfully (3 sessions)", true));

        BasicResponse response = accountController.requestLogout("Bearer auth-token");

        assertTrue(response.success());
        assertEquals("Logged out successfully (3 sessions)", response.message());

        verify(studentService).requestLogout("Bearer auth-token");
    }

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

    @Test
    void deleteAccountShouldFailWithoutBearerToken() {
        when(studentService.deleteAccount("invalid-header"))
                .thenReturn(new BasicResponse("Error, couldnt authenticate user", false));

        BasicResponse response = accountController.deleteAccount("invalid-header");

        assertFalse(response.success());
        assertEquals("Error, couldnt authenticate user", response.message());

        verify(studentService).deleteAccount("invalid-header");
    }

    @Test
    void deleteAccountShouldFailForWrongAuthToken() {
        when(studentService.deleteAccount("Bearer wrong-token"))
                .thenReturn(new BasicResponse("Error, couldnt authenticate user", false));

        BasicResponse response = accountController.deleteAccount("Bearer wrong-token");

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

        BasicResponse response = accountController.deleteAccount("Bearer auth-token");

        assertTrue(response.success());
        assertEquals(
                "Deleted Account succesfully: test@student.kit.edu",
                response.message()
        );

        verify(studentService).deleteAccount("Bearer auth-token");
    }
}