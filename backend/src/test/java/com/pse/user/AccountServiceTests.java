package com.pse.user;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.UserRatingResponse;
import com.pse.auth.service.AuthService;
import com.pse.user.dto.StudentProfileResponse;
import com.pse.user.model.Student;
import com.pse.user.service.AccountService;
import com.pse.user.service.StudentService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTests {

    @Mock
    private AuthService authService;

    @Mock
    private StudentService studentService;

    @InjectMocks
    private AccountService accountService;


    @Test
    void getUserInformationDelegatesToStudentService() {

        UUID studentId = UUID.randomUUID();

        Student student = mock(Student.class);

        StudentProfileResponse expectedResponse =
                mock(StudentProfileResponse.class);

        when(student.getId()).thenReturn(studentId);

        when(studentService.getUserInformation(studentId))
                .thenReturn(expectedResponse);


        StudentProfileResponse response = accountService.getUserInformation(student);


        assertSame(expectedResponse, response);

        verify(studentService).getUserInformation(studentId);
    }


    @Test
    void getUserRatingsDelegatesToStudentService() {

        UUID studentId = UUID.randomUUID();

        Student student = mock(Student.class);

        UserRatingResponse expectedResponse =
                mock(UserRatingResponse.class);

        when(student.getId()).thenReturn(studentId);

        when(studentService.getUserRatings(studentId))
                .thenReturn(expectedResponse);


        UserRatingResponse response = accountService.getUserRatings(student);


        assertSame(expectedResponse, response);

        verify(studentService).getUserRatings(studentId);
    }


    @Test
    void requestLogoutInvalidatesAllSessions() {

        Student student = mock(Student.class);

        when(student.getKitEmail())
                .thenReturn("student@student.kit.edu");

        when(authService.invalidateAllAuthTokensForEmail(
                "student@student.kit.edu"
        )).thenReturn(3);


        BasicResponse response = accountService.requestLogout(student);


        assertTrue(response.success());

        assertEquals(
                "Logged out successfully (3 sessions)",
                response.message()
        );

        verify(authService)
                .invalidateAllAuthTokensForEmail(
                        "student@student.kit.edu"
                );
    }


    @Test
    void deleteAccountInvalidatesTokensWhenDeletionWasSuccessful() {

        Student student = mock(Student.class);

        when(student.getKitEmail())
                .thenReturn("student@student.kit.edu");

        BasicResponse deleteResponse =
                new BasicResponse(
                        "Deleted Account succesfully",
                        true
                );

        when(studentService.deleteAccount(student))
                .thenReturn(deleteResponse);


        BasicResponse response = accountService.deleteAccount(student);


        assertSame(deleteResponse, response);

        verify(authService)
                .invalidateAllAuthTokensForEmail(
                        "student@student.kit.edu"
                );
    }


    @Test
    void deleteAccountDoesNotInvalidateTokensWhenDeletionFailed() {

        Student student = mock(Student.class);

        BasicResponse deleteResponse =
                new BasicResponse(
                        "Error, couldnt find student",
                        false
                );

        when(studentService.deleteAccount(student))
                .thenReturn(deleteResponse);


        BasicResponse response = accountService.deleteAccount(student);


        assertSame(deleteResponse, response);

        verifyNoInteractions(authService);
    }
}