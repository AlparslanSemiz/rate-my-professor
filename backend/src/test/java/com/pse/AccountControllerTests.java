package com.pse;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.UserRatingResponse;
import com.pse.security.AuthenticatedUser;
import com.pse.user.controller.AccountController;
import com.pse.user.dto.StudentProfileResponse;
import com.pse.user.model.Student;
import com.pse.user.service.AccountService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AccountControllerTests {

    @Mock
    private AccountService accountService;

    @Mock
    private AuthenticatedUser principal;

    @Mock
    private Student student;

    @InjectMocks
    private AccountController accountController;

    @BeforeEach
    void setUp() {
        when(principal.student()).thenReturn(student);
    }

    @Test
    void informationShouldReturnUserInformation() {

        StudentProfileResponse expectedResponse = new StudentProfileResponse(
                "Success",
                true,
                "SchnellerFuchs1234",
                "https://api.dicebear.com/avatar.svg",
                4.5,
                0,
                0,
                42
        );

        when(accountService.getUserInformation(student))
                .thenReturn(expectedResponse);

        StudentProfileResponse response =
                accountController.getUserInformation(principal);

        assertSame(expectedResponse, response);

        verify(accountService).getUserInformation(student);
    }

    @Test
    void ratingsShouldReturnUserRatings() {

        UserRatingResponse expectedResponse = new UserRatingResponse(
                "Success",
                true,
                null
        );

        when(accountService.getUserRatings(student))
                .thenReturn(expectedResponse);

        UserRatingResponse response =
                accountController.getUserRatings(principal);

        assertSame(expectedResponse, response);

        verify(accountService).getUserRatings(student);
    }

    @Test
    void logoutShouldReturnServiceResponse() {

        BasicResponse expectedResponse =
                new BasicResponse(
                        "Logged out successfully (3 sessions)",
                        true
                );

        when(accountService.requestLogout(student))
                .thenReturn(expectedResponse);

        BasicResponse response =
                accountController.requestLogout(principal);

        assertSame(expectedResponse, response);

        verify(accountService).requestLogout(student);
    }

    @Test
    void deleteAccountShouldReturnServiceResponse() {

        BasicResponse expectedResponse =
                new BasicResponse(
                        "Deleted Account successfully: test@student.kit.edu",
                        true
                );

        when(accountService.deleteAccount(student))
                .thenReturn(expectedResponse);

        BasicResponse response =
                accountController.deleteAccount(principal);

        assertSame(expectedResponse, response);

        verify(accountService).deleteAccount(student);
    }
}