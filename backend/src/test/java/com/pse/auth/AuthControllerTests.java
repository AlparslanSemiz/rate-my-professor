package com.pse.auth;

import com.pse.auth.controller.AuthController;
import com.pse.auth.dto.request.LoginRequest;
import com.pse.auth.dto.request.OTPRequest;
import com.pse.auth.dto.request.ValidateCredentialsRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.LoginResponse;
import com.pse.auth.service.AuthService;
import com.pse.security.AuthenticatedUser;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTests {

    @Mock
    private AuthService authService;

    @Mock
    private HttpServletRequest httpRequest;

    @Mock
    private AuthenticatedUser principal;

    @InjectMocks
    private AuthController authController;


    @Test
    void requestLoginReturnsServiceResponse() {

        OTPRequest request = mock(OTPRequest.class);

        BasicResponse expected =
                new BasicResponse(
                        "Login code sent",
                        true
                );

        when(authService.requestLogin(
                request,
                httpRequest
        )).thenReturn(expected);


        BasicResponse response = authController.requestLogin(
                        request,
                        httpRequest
                );


        assertSame(expected, response);

        verify(authService)
                .requestLogin(
                        request,
                        httpRequest
                );
    }


    @Test
    void loginReturnsServiceResponse() {

        LoginRequest request = mock(LoginRequest.class);

        LoginResponse expected = mock(LoginResponse.class);

        when(authService.login(
                request,
                httpRequest
        )).thenReturn(expected);


        LoginResponse response = authController.login(
                        request,
                        httpRequest
                );


        assertSame(expected, response);

        verify(authService).login(
                        request,
                        httpRequest
                );
    }


    @Test
    void logoutReturnsServiceResponse() {

        BasicResponse expected =
                new BasicResponse(
                        "Logged out successfully",
                        true
                );

        when(authService.logout(principal))
                .thenReturn(expected);


        BasicResponse response =
                authController.logout(principal);


        assertSame(expected, response);

        verify(authService).logout(principal);
    }


    @Test
    void logoutAllReturnsServiceResponse() {

        BasicResponse expected = new BasicResponse("Logged out from all devices", true);

        when(authService.logoutAll(principal))
                .thenReturn(expected);


        BasicResponse response = authController.logoutAll(principal);


        assertSame(expected, response);

        verify(authService).logoutAll(principal);
    }


    @Test
    void validateReturnsServiceResponse() {

        String authHeader = "Bearer secret-token";

        ValidateCredentialsRequest request = mock(ValidateCredentialsRequest.class);

        BasicResponse expected = new BasicResponse("Correct", true);

        when(authService.validate(
                authHeader,
                request
        )).thenReturn(expected);


        BasicResponse response = authController.validate(
                        authHeader,
                        request
                );


        assertSame(expected, response);

        verify(authService).validate(
                        authHeader,
                        request
                );
    }
}