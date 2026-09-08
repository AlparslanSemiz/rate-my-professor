package com.pse.auth.service;

import com.pse.config.properties.RateLimitProperties;
import com.pse.config.properties.AuthProperties;
import com.pse.auth.dto.request.ValidateCredentialsRequest;
import com.pse.auth.dto.response.AuthMeResponse;
import com.pse.shared.dto.BasicResponse;
import com.pse.auth.exception.InvalidAuthTokenException;
import com.pse.auth.model.Token;
import com.pse.moderation.model.Admin;
import com.pse.security.AuthenticatedUser;
import com.pse.security.TokenAuthenticationService;
import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;
import com.pse.user.model.Student;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mock;


import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Reading a bearer token back into an account.
 *
 * <p>Split out of {@code AuthServiceTests} with the code it covers; the test bodies are
 * unchanged. It also moves into the mirror package, which the original was one level
 * above.
 */
@ExtendWith(MockitoExtension.class)
class IdentityServiceTests {

    private static final Clock CLOCK =
            Clock.fixed(Instant.parse("2026-09-05T12:00:00Z"), ZoneOffset.UTC);

    private static final AuthProperties LIFETIMES =
            new AuthProperties(Duration.ofDays(1), Duration.ofDays(365), Duration.ofMinutes(5));

    private static final RateLimitProperties RATE_LIMITS =
            new RateLimitProperties(Duration.ofMinutes(15), "x".repeat(32), 3, 20, 10, 30);

    @Mock
    private AdminSuperuserPolicy superuserPolicy;

    @Mock
    private TokenAuthenticationService tokenAuthenticationService;

    private IdentityService identityService;

    @BeforeEach
    void setUp() {
        identityService = new IdentityService(tokenAuthenticationService, superuserPolicy);
    }


    private Student activeStudent(String email) {
        Student student = new Student();
        student.setKitEmail(email);
        student.setUsername("student");
        student.setStatus(UserStatus.ACTIVE);
        return student;
    }




    @Test
    void validateReturnsSuccessForMatchingTokenAndEmail() {

        ValidateCredentialsRequest request = mock(ValidateCredentialsRequest.class);

        AuthenticatedUser principal = mock(AuthenticatedUser.class);

        Student student = mock(Student.class);


        when(request.email())
                .thenReturn("student@student.kit.edu");

        when(student.getKitEmail())
                .thenReturn("student@student.kit.edu");

        when(principal.student())
                .thenReturn(student);

        when(tokenAuthenticationService.authenticate("secret-token"))
                .thenReturn(
                        Optional.of(principal)
                );


        BasicResponse response = identityService.validate(
                        "Bearer secret-token",
                        request
                );


        assertThat(response.success()).isTrue();

        assertThat(response.message()).isEqualTo("Correct auth-Token for email: "
                        + "student@student.kit.edu");
    }



    @Test
    void validateReturnsErrorWhenEmailDoesNotMatchToken() {

        ValidateCredentialsRequest request = mock(ValidateCredentialsRequest.class);

        AuthenticatedUser principal = mock(AuthenticatedUser.class);

        Student student = mock(Student.class);


        when(request.email())
                .thenReturn(
                        "other@student.kit.edu"
                );

        when(student.getKitEmail())
                .thenReturn(
                        "student@student.kit.edu"
                );

        when(principal.student())
                .thenReturn(student);

        when(tokenAuthenticationService.authenticate("secret-token"))
                .thenReturn(
                        Optional.of(principal)
                );


        BasicResponse response = identityService.validate("Bearer secret-token", request);


        assertThat(response.success()).isFalse();

        assertThat(response.message()).isEqualTo("Error, wrong email for auth Token");
    }



    @Test
    void verifyUserRejectsMissingBearerHeader() {

        assertThatThrownBy(() -> identityService.verifyUser(
                        "secret-token"
                )).isInstanceOf(InvalidAuthTokenException.class);
    }


    @Test
    void me_studentSession_reportsTheStudentRoleAndNeverAsksAboutSuperusers() {
        Student student = activeStudent("student@student.kit.edu");
        AuthMeResponse response =
                identityService.me(new AuthenticatedUser(student, new Token(), null));

        assertThat(response.user().role()).isEqualTo(UserRole.STUDENT);
        assertThat(response.user().isSuperAdmin()).isFalse();
        verifyNoInteractions(superuserPolicy);
    }


    @Test
    void me_administratorSession_reportsTheAdminRoleAndTheSuperuserFlag() {
        Student student = activeStudent("admin@student.kit.edu");
        when(superuserPolicy.isSuperuser("admin@student.kit.edu")).thenReturn(true);

        AuthMeResponse response =
                identityService.me(new AuthenticatedUser(student, new Token(), new Admin()));

        assertThat(response.user().role()).isEqualTo(UserRole.ADMIN);
        assertThat(response.user().isSuperAdmin()).isTrue();
    }


    @Test
    void me_administratorWhoIsNotASuperuser_reportsTheAdminRoleWithoutTheFlag() {
        Student student = activeStudent("admin@student.kit.edu");
        when(superuserPolicy.isSuperuser("admin@student.kit.edu")).thenReturn(false);

        AuthMeResponse response =
                identityService.me(new AuthenticatedUser(student, new Token(), new Admin()));

        assertThat(response.user().role()).isEqualTo(UserRole.ADMIN);
        assertThat(response.user().isSuperAdmin()).isFalse();
    }


    @Test
    void validate_wellFormedHeaderThatResolvesToNobody_reportsTheTokenAsWrong() {
        // A malformed header throws; a well-formed one carrying a token nobody holds comes
        // back as null, and validate has to answer rather than propagate that difference.
        when(tokenAuthenticationService.authenticate("gone")).thenReturn(Optional.empty());

        BasicResponse response = identityService.validate(
                "Bearer gone", new ValidateCredentialsRequest("student@student.kit.edu"));

        assertThat(response.success()).isFalse();
        assertThat(response.message()).isEqualTo("Error, wrong Auth-Token");
    }


    @Test
    void validate_requestWithoutAnEmail_reportsTheEmailAsWrongRatherThanThrowing() {
        Student student = activeStudent("student@student.kit.edu");
        when(tokenAuthenticationService.authenticate("token"))
                .thenReturn(Optional.of(new AuthenticatedUser(student, new Token(), null)));

        BasicResponse response =
                identityService.validate("Bearer token", new ValidateCredentialsRequest(null));

        assertThat(response.success()).isFalse();
        assertThat(response.message()).isEqualTo("Error, wrong email for auth Token");
    }
}
