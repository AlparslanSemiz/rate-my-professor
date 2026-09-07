package com.pse.shared.error;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.exception.InvalidAuthTokenException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

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
            MethodArgumentTypeMismatchException.class
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

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<BasicResponse> handleWrongMethod(HttpRequestMethodNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new BasicResponse("Not found", false));
    }

    /**
     * A body sent in a media type no converter can read -- F-17 in docs/test-findings.md.
     * Without this the catch-all below claimed it first and every one of the routes that
     * read a {@code @RequestBody} answered 500, telling the caller the backend broke when
     * the request was at fault.
     *
     * <p>Deliberately declared one exception type at a time rather than by extending
     * {@code ResponseEntityExceptionHandler}: that base class maps this type together with
     * {@code HttpRequestMethodNotSupportedException} (F-16) and
     * {@code MissingServletRequestParameterException} (F-14), so inheriting it would both
     * clash with {@link #handleWrongMethod} -- an ambiguous mapping the context refuses to
     * start with -- and change two other documented answers nobody asked to change. It
     * would also switch the body to {@code ProblemDetail}, which the Android client does
     * not parse.
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
