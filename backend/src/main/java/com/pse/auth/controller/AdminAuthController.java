package com.pse.auth.controller;

import com.pse.auth.dto.request.LoginRequest;
import com.pse.auth.dto.request.OTPRequest;
import com.pse.auth.dto.response.AuthMeResponse;
import com.pse.shared.dto.BasicResponse;
import com.pse.auth.dto.response.LoginResponse;
import com.pse.auth.service.AuthService;
import com.pse.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The admin panel's entry into the API. It is a separate controller rather than a second
 * path on {@link AuthController} because the two logins are two contracts: this one refuses
 * accounts that are not administrators and hands out sessions on the admin schedule, while
 * {@code /auth/login} serves every account for a year. Only login differs; the rest is the
 * same service call, mirrored here so the panel has one base path for the whole API.
 */
@RestController
@RequestMapping("/admin/auth")
public class AdminAuthController {

    private final AuthService authService;

    public AdminAuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/request-login")
    public BasicResponse requestLogin(@Valid @RequestBody OTPRequest request, HttpServletRequest httpRequest) {
        return authService.requestLogin(request, httpRequest);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return authService.adminLogin(request, httpRequest);
    }

    @PostMapping("/logout")
    public BasicResponse logout(@AuthenticationPrincipal AuthenticatedUser principal) {
        return authService.logout(principal);
    }

    @PostMapping("/logout-all")
    public BasicResponse logoutAll(@AuthenticationPrincipal AuthenticatedUser principal) {
        return authService.logoutAll(principal);
    }

    @GetMapping("/me")
    public AuthMeResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return authService.me(principal);
    }
}
