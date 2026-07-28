package com.pse.shared.error;

import com.pse.auth.dto.response.BasicResponse;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
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
    ResponseEntity<BasicResponse> handleApiException(ApiException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(new BasicResponse(exception.getMessage(), false));
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

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<BasicResponse> handleConflict(DataIntegrityViolationException exception) {
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
