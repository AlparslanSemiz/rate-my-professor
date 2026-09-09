package com.pse.auth.service;

import com.pse.auth.dto.request.ValidateCredentialsRequest;
import com.pse.auth.dto.response.AuthMeResponse;
import com.pse.auth.dto.response.AuthUserResponse;
import com.pse.auth.exception.InvalidAuthTokenException;
import com.pse.security.AuthenticatedUser;
import com.pse.security.TokenAuthenticationService;
import com.pse.shared.dto.BasicResponse;
import com.pse.shared.enums.UserRole;
import com.pse.shared.util.KitEmail;
import com.pse.user.model.Student;
import org.springframework.stereotype.Service;

/**
 * Answers "who is holding this token", for the routes that ask directly and for the two
 * services that read the {@code Authorization} header by hand.
 *
 * <p>It issues nothing and revokes nothing, which is why it is not part of {@link
 * SessionIssuer} or {@link SessionRevoker}: it needs neither the token table nor a clock.
 */
@Service
public class IdentityService {

    private final TokenAuthenticationService tokenAuthenticationService;
    private final AdminSuperuserPolicy superuserPolicy;

    /**
     * Creates IdentityService.
     *
     * @param tokenAuthenticationService the tokenAuthenticationService
     * @param superuserPolicy the superuserPolicy
     */
    public IdentityService(
            TokenAuthenticationService tokenAuthenticationService,
            AdminSuperuserPolicy superuserPolicy
    ) {
        this.tokenAuthenticationService = tokenAuthenticationService;
        this.superuserPolicy = superuserPolicy;
    }

    /**
     * Returns me.
     *
     * @param principal the principal
     * @return the result
     */
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
                        student.getStatus(),
                        principal.isAdmin()
                                && superuserPolicy.isSuperuser(student.getKitEmail())
                )
        );
    }

    /**
     * Returns validate.
     *
     * @param authHeader the authHeader
     * @param request the request
     * @return the result
     */
    public BasicResponse validate(String authHeader, ValidateCredentialsRequest request) {

        Student student = verifyUser(authHeader);
        if (student == null) {
            return new BasicResponse("Error, wrong Auth-Token", false);
        }
        if (request.email() == null
                || !student.getKitEmail().equals(KitEmail.normalize(request.email()))) {
            return new BasicResponse("Error, wrong email for auth Token", false);
        }
        return new BasicResponse("Correct auth-Token for email: " + request.email(), true);
    }

    /**
     * The account behind a raw {@code Authorization} header, for the three routes the
     * security chain leaves open and which therefore read the header themselves.
     *
     * @return {@code null} when the header is well-formed but the token is not valid
     * @throws InvalidAuthTokenException when there is no bearer token to read at all, which
     *         {@code GlobalExceptionHandler} answers as a 401 rather than a 500
     *
     * @param authHeader the authHeader
     */
    public Student verifyUser(String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new InvalidAuthTokenException("Couldn't find Auth-Token");
        }

        return tokenAuthenticationService
                .authenticate(authHeader.substring("Bearer ".length()).trim())
                .map(AuthenticatedUser::student)
                .orElse(null);
    }
}
