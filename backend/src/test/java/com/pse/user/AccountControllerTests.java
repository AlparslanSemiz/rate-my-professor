package com.pse.user;

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

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.*;

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
    void getUserInformationReturnsServiceResponse() {

        StudentProfileResponse expectedResponse = mock(StudentProfileResponse.class);

        when(accountService.getUserInformation(student))
                .thenReturn(expectedResponse);


        StudentProfileResponse response = accountController.getUserInformation(principal);


        assertSame(expectedResponse, response);

        verify(accountService).getUserInformation(student);
    }


    @Test
    void getUserRatingsReturnsServiceResponse() {

        UserRatingResponse expectedResponse = mock(UserRatingResponse.class);

        when(accountService.getUserRatings(student))
                .thenReturn(expectedResponse);


        UserRatingResponse response = accountController.getUserRatings(principal);

        assertSame(expectedResponse, response);

        verify(accountService).getUserRatings(student);
    }


    @Test
    void requestLogoutReturnsServiceResponse() {

        BasicResponse expectedResponse =
                new BasicResponse("Logged out", true);

        when(accountService.requestLogout(student))
                .thenReturn(expectedResponse);


        BasicResponse response = accountController.requestLogout(principal);


        assertSame(expectedResponse, response);

        verify(accountService).requestLogout(student);
    }


    @Test
    void deleteAccountReturnsServiceResponse() {

        BasicResponse expectedResponse = new BasicResponse("Deleted", true);

        when(accountService.deleteAccount(student))
                .thenReturn(expectedResponse);


        BasicResponse response = accountController.deleteAccount(principal);


        assertSame(expectedResponse, response);

        verify(accountService).deleteAccount(student);
    }
}