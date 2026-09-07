package com.pse.shared.error;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.exception.InvalidAuthTokenException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Set;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RateLimitException.class)
    ResponseEntity<BasicResponse> handleRateLimit(RateLimitException exception) {
        return ResponseEntity.status(exception.getStatus())
                .header(HttpHeaders.RETRY_AFTER, Long.toString(exception.getRetryAfterSeconds()))
                .body(new BasicResponse(exception.getMessage(), false));
    }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiErrorResponse> handleApiException(ApiException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(ApiErrorResponse.of(exception.getMessage(), exception.getCode()));
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            HandlerMethodValidationException.class,
            ConstraintViolationException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class
    })
    ResponseEntity<BasicResponse> handleBadRequest(Exception exception) {
        return ResponseEntity.badRequest()
                .body(new BasicResponse("Invalid request", false));
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    ResponseEntity<BasicResponse> handleMissingHeader(MissingRequestHeaderException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new BasicResponse("Not logged in", false));
    }

    /**
     * Thrown by {@code AuthService.verifyUser} when the Authorization header is absent or
     * not a Bearer token. It reaches here only from the endpoints that read the header by
     * hand -- {@code POST /reports}, {@code /auth/validate}, {@code /admins/validate} --
     * because the security chain leaves those open. Without this it fell through to the
     * catch-all below and answered 500, where the documented contract is 401.
     */
    @ExceptionHandler(InvalidAuthTokenException.class)
    ResponseEntity<BasicResponse> handleInvalidAuthToken(InvalidAuthTokenException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new BasicResponse("Not logged in", false));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<BasicResponse> handleNotFound(NoResourceFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new BasicResponse("Not found", false));
    }

    /**
     * A path that exists, called with a verb it does not map -- F-16 in
     * docs/test-findings.md. This answered 404 with the same body as {@link #handleNotFound}
     * until it was corrected, so which of the two mechanisms had run was indistinguishable
     * from the response: "no such path" and "the path exists, the method does not" are
     * different facts and a client that cannot tell them apart cannot retry correctly.
     *
     * <p>The {@code Allow} header is half of a 405. Without it the caller learns that its
     * verb is wrong but not which verb would have worked, and RFC 9110 requires it.
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<BasicResponse> handleWrongMethod(HttpRequestMethodNotSupportedException exception) {
        ResponseEntity.BodyBuilder response = ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED);

        Set<HttpMethod> allowed = exception.getSupportedHttpMethods();
        if (allowed != null && !allowed.isEmpty()) {
            response.header(HttpHeaders.ALLOW, allowed.stream()
                    .map(HttpMethod::name)
                    .sorted()
                    .collect(Collectors.joining(", ")));
        }

        return response.body(new BasicResponse("Method not allowed", false));
    }

    /**
     * A body sent in a media type no converter can read -- F-17 in docs/test-findings.md.
     * Without this the catch-all below claimed it first and every one of the routes that
     * read a {@code @RequestBody} answered 500, telling the caller the backend broke when
     * the request was at fault.
     *
     * <p>Still declared one exception type at a time rather than by extending
     * {@code ResponseEntityExceptionHandler}. When this handler was written that base class
     * would have changed two other documented answers as a side effect; F-16 and F-14 have
     * since been corrected to the codes it would have produced, so that reason is gone. The
     * remaining one is not: the base class clashes with {@link #handleWrongMethod} -- an
     * ambiguous mapping the context refuses to start with -- and switches the body to
     * {@code ProblemDetail}, which the Android client does not parse.
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<BasicResponse> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(new BasicResponse("Unsupported media type", false));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<BasicResponse> handleConflict(DataIntegrityViolationException exception) {
        LOGGER.error("State conflict", exception);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new BasicResponse("State conflict", false));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<BasicResponse> handleUnexpected(Exception exception) {
        LOGGER.error("Unexpected API error", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new BasicResponse("Unexpected backend error", false));
    }
}
