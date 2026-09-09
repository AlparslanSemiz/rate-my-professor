package com.pse.auth.controller;

import com.pse.auth.service.IdentityService;
import com.pse.auth.service.LoginCodeService;
import com.pse.auth.service.SessionIssuer;
import com.pse.auth.service.SessionRevoker;
import com.pse.auth.dto.request.LoginRequest;
import com.pse.auth.dto.request.OTPRequest;
import com.pse.auth.dto.request.ValidateCredentialsRequest;
import com.pse.shared.dto.BasicResponse;
import com.pse.auth.dto.response.LoginResponse;
import com.pse.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Provides AuthController.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final LoginCodeService loginCodeService;
    private final SessionIssuer sessionIssuer;
    private final SessionRevoker sessionRevoker;
    private final IdentityService identityService;

    /**
     * Creates AuthController.
     *
     * @param loginCodeService the loginCodeService
     * @param sessionIssuer the sessionIssuer
     * @param sessionRevoker the sessionRevoker
     * @param identityService the identityService
     */
    public AuthController(
            LoginCodeService loginCodeService,
            SessionIssuer sessionIssuer,
            SessionRevoker sessionRevoker,
            IdentityService identityService
    ) {
        this.loginCodeService = loginCodeService;
        this.sessionIssuer = sessionIssuer;
        this.sessionRevoker = sessionRevoker;
        this.identityService = identityService;
    }

    /**
     * Returns requestLogin.
     *
     * @param request the request
     * @param httpRequest the httpRequest
     * @return the result
     */
    @PostMapping("/request-login")
    public BasicResponse requestLogin(@Valid @RequestBody OTPRequest request, HttpServletRequest httpRequest) {
        return loginCodeService.requestLogin(request, httpRequest);
    }

    /**
     * Returns login.
     *
     * @param request the request
     * @param httpRequest the httpRequest
     * @return the result
     */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return sessionIssuer.login(request, httpRequest);
    }

    /**
     * Returns logout.
     *
     * @param principal the principal
     * @return the result
     */
    @PostMapping("/logout")
    public BasicResponse logout(@AuthenticationPrincipal AuthenticatedUser principal) {
        return sessionRevoker.logout(principal);
    }

    /**
     * Returns logoutAll.
     *
     * @param principal the principal
     * @return the result
     */
    @PostMapping("/logout-all")
    public BasicResponse logoutAll(@AuthenticationPrincipal AuthenticatedUser principal) {
        return sessionRevoker.logoutAll(principal);
    }


    /**
     * Returns validate.
     *
     * @param authHeader the authHeader
     * @param request the request
     * @return the result
     */
    @PostMapping("/validate")
    public BasicResponse validate(@RequestHeader("Authorization") String authHeader,
                                  @Valid @RequestBody ValidateCredentialsRequest request) {
        return identityService.validate(authHeader, request);
    }
}
