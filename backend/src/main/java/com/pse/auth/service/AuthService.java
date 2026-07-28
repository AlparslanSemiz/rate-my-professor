package com.pse.auth.service;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.auth.dto.request.LoginRequest;
import com.pse.auth.dto.request.OTPRequest;
import com.pse.auth.dto.request.ValidateCredsRequest;
import com.pse.auth.dto.response.AuthMeResponse;
import com.pse.auth.dto.response.AuthUserResponse;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.LoginResponse;
import com.pse.auth.model.Token;
import com.pse.auth.repository.TokenRepository;
import com.pse.moderation.model.Admin;
import com.pse.moderation.repository.AdminRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.security.TokenAuthenticationService;
import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.error.ApiException;
import com.pse.shared.util.HashGenerator;
import com.pse.shared.util.NameGenerator;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern KIT_EMAIL =
            Pattern.compile("^[A-Z0-9._%+-]+@student\\.kit\\.edu$", Pattern.CASE_INSENSITIVE);

    private final StudentRepository studentRepository;
    private final AdminRepository adminRepository;
    private final TokenRepository tokenRepository;
    private final OtpService otpService;
    private final RateLimitService rateLimitService;
    private final LoginCodeDelivery loginCodeDelivery;
    private final AdminBootstrapPolicy bootstrapPolicy;
    private final AuditWriter auditWriter;
    private final TokenAuthenticationService tokenAuthenticationService;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;
    private final Duration adminSessionTtl;
    private final Duration studentSessionTtl;
    private final int requestEmailLimit;
    private final int requestIpLimit;
    private final int loginEmailLimit;
    private final int loginIpLimit;

    public AuthService(
            StudentRepository studentRepository,
            AdminRepository adminRepository,
            TokenRepository tokenRepository,
            OtpService otpService,
            RateLimitService rateLimitService,
            LoginCodeDelivery loginCodeDelivery,
            AdminBootstrapPolicy bootstrapPolicy,
            AuditWriter auditWriter,
            TokenAuthenticationService tokenAuthenticationService,
            ApplicationEventPublisher eventPublisher,
            Clock clock,
            @Value("${app.auth.admin-session-ttl:PT12H}") Duration adminSessionTtl,
            @Value("${app.auth.student-session-ttl:P365D}") Duration studentSessionTtl,
            @Value("${app.auth.rate-limit.request-email:3}") int requestEmailLimit,
            @Value("${app.auth.rate-limit.request-ip:20}") int requestIpLimit,
            @Value("${app.auth.rate-limit.login-email:10}") int loginEmailLimit,
            @Value("${app.auth.rate-limit.login-ip:30}") int loginIpLimit
    ) {
        this.studentRepository = studentRepository;
        this.adminRepository = adminRepository;
        this.tokenRepository = tokenRepository;
        this.otpService = otpService;
        this.rateLimitService = rateLimitService;
        this.loginCodeDelivery = loginCodeDelivery;
        this.bootstrapPolicy = bootstrapPolicy;
        this.auditWriter = auditWriter;
        this.tokenAuthenticationService = tokenAuthenticationService;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
        this.adminSessionTtl = adminSessionTtl;
        this.studentSessionTtl = studentSessionTtl;
        this.requestEmailLimit = requestEmailLimit;
        this.requestIpLimit = requestIpLimit;
        this.loginEmailLimit = loginEmailLimit;
        this.loginIpLimit = loginIpLimit;
    }

    public BasicResponse requestLogin(OTPRequest request, HttpServletRequest httpRequest) {
        String email = normalizeAndValidateEmail(request.email());
        String emailSubject = rateLimitService.emailSubject(email);
        String ipSubject = rateLimitService.ipSubject(httpRequest.getRemoteAddr());
        rateLimitService.consume(RateLimitService.REQUEST_CODE, emailSubject, requestEmailLimit);
        rateLimitService.consume(RateLimitService.REQUEST_CODE, ipSubject, requestIpLimit);

        String code = otpService.issue(email);
        try {
            loginCodeDelivery.send(email, code);
        } catch (RuntimeException exception) {
            otpService.invalidate(email);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not send login code");
        }
        return new BasicResponse("Login code sent", true);
    }

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String email = normalizeAndValidateEmail(request.email());
        String submittedCode = request.loginToken().trim();
        String emailSubject = rateLimitService.emailSubject(email);
        String ipSubject = rateLimitService.ipSubject(httpRequest.getRemoteAddr());

        rateLimitService.ensureAllowed(RateLimitService.LOGIN_FAILURE, emailSubject, loginEmailLimit);
        rateLimitService.ensureAllowed(RateLimitService.LOGIN_FAILURE, ipSubject, loginIpLimit);

        if (!otpService.consume(email, submittedCode)) {
            rateLimitService.consume(RateLimitService.LOGIN_FAILURE, emailSubject, loginEmailLimit);
            rateLimitService.consume(RateLimitService.LOGIN_FAILURE, ipSubject, loginIpLimit);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired login code");
        }

        Student student = studentRepository.findByKitEmail(email).orElseGet(() -> createStudent(email));
        if (student.getStatus() == UserStatus.BLOCKED || student.getStatus() == UserStatus.DELETED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is not active");
        }
        student.setLastSeenAt(LocalDateTime.now(clock));
        studentRepository.save(student);

        Admin admin = adminRepository.findByStudent(student).orElse(null);
        if (admin == null && bootstrapPolicy.shouldBootstrap(email)) {
            admin = new Admin();
            admin.setStudent(student);
            admin = adminRepository.save(admin);
        }

        String rawToken = TokenGenerator.generateToken();
        Token token = new Token();
        token.setEmail(email);
        token.setStudent(student);
        token.setHash(HashGenerator.hashToken(rawToken));
        token.setExpiresAt(LocalDateTime.now(clock).plus(admin == null ? studentSessionTtl : adminSessionTtl));
        token = tokenRepository.save(token);

        if (admin != null) {
            auditWriter.write(
                    admin,
                    AuditAction.ADMIN_LOGIN,
                    AuditTargetType.ADMIN_SESSION,
                    token.getId(),
                    student.getUsername() + " admin session",
                    AuditWriter.change("authenticated", false, true),
                    Map.of("method", "EMAIL_OTP")
            );
        }

        rateLimitService.reset(RateLimitService.LOGIN_FAILURE, emailSubject);
        eventPublisher.publishEvent(new SuccessfulLoginEvent(
                email,
                httpRequest.getRemoteAddr(),
                safeUserAgent(httpRequest.getHeader("User-Agent"))
        ));
        return new LoginResponse("Login successful", true, rawToken);
    }

    @Transactional
    public BasicResponse logout(AuthenticatedUser principal) {
        Token token = principal.token();
        if (!token.isRevoked()) {
            token.setRevoked(true);
            tokenRepository.save(token);
            auditWriter.write(
                    principal.admin(),
                    AuditAction.ADMIN_LOGOUT,
                    AuditTargetType.ADMIN_SESSION,
                    token.getId(),
                    principal.student().getUsername() + " admin session",
                    AuditWriter.change("authenticated", true, false),
                    Map.of()
            );
        }
        return new BasicResponse("Logged out successfully", true);
    }

    @Transactional
    public BasicResponse logoutAll(AuthenticatedUser principal) {
        Student student = principal.student();
        List<Token> tokens = tokenRepository.findByStudentOrEmail(student, student.getKitEmail());
        int revoked = 0;
        for (Token token : tokens) {
            if (!token.isRevoked()) {
                token.setRevoked(true);
                revoked++;
            }
        }
        tokenRepository.saveAll(tokens);

        if (principal.isAdmin()) {
            auditWriter.write(
                    principal.admin(),
                    AuditAction.ADMIN_LOGOUT,
                    AuditTargetType.ADMIN_SESSION,
                    principal.token().getId(),
                    student.getUsername() + " all sessions",
                    AuditWriter.change("authenticated", true, false),
                    Map.of("scope", "ALL_DEVICES", "revokedSessions", revoked)
            );
        }
        return new BasicResponse("Logged out from all devices (" + revoked + " sessions)", true);
    }

    public AuthMeResponse me(AuthenticatedUser principal) {
        Student student = principal.student();
        return new AuthMeResponse(
                "Authenticated",
                true,
                new AuthUserResponse(
                        student.getId(),
                        student.getUsername(),
                        student.getKitEmail(),
                        principal.isAdmin() ? UserRole.ADMIN : UserRole.STUDENT,
                        student.getStatus()
                )
        );
    }

    public BasicResponse me(String authHeader) {
        Student student = verifyUser(authHeader);
        return student == null
                ? new BasicResponse("Not logged in", false)
                : new BasicResponse("Logged in as: " + student.getKitEmail(), true);
    }

    public BasicResponse validate(String authHeader, ValidateCredsRequest request) {
        Student student = verifyUser(authHeader);
        if (student == null) {
            return new BasicResponse("Error, wrong Auth-Token", false);
        }
        if (request.email() == null
                || !student.getKitEmail().equals(request.email().trim().toLowerCase(Locale.ROOT))) {
            return new BasicResponse("Error, wrong email for auth Token", false);
        }
        return new BasicResponse("Correct auth-Token for email: " + request.email(), true);
    }

    public Student verifyUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return tokenAuthenticationService
                .authenticate(authHeader.substring("Bearer ".length()).trim())
                .map(AuthenticatedUser::student)
                .orElse(null);
    }

    @Transactional
    public int invalidateAllAuthTokensForEmail(String email) {
        List<Token> tokens = tokenRepository.findByEmail(email);
        tokens.forEach(token -> token.setRevoked(true));
        tokenRepository.saveAll(tokens);
        return tokens.size();
    }

    private Student createStudent(String email) {
        Student student = new Student();
        student.setKitEmail(email);
        student.setUsername(NameGenerator.generateUsername());
        student.setEmailVerifiedAt(LocalDateTime.now(clock));
        student.setCredibilityScore(0);
        student.setStatus(UserStatus.ACTIVE);
        return studentRepository.save(student);
    }

    private String normalizeAndValidateEmail(String rawEmail) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
        if (!KIT_EMAIL.matcher(email).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid KIT email");
        }
        return email;
    }

    private String safeUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown";
        }
        return userAgent.substring(0, Math.min(userAgent.length(), 500));
    }
}
