package com.pse.audit.service;

import com.pse.shared.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Component
public class AuditCursorCodec {

    private static final String VERSION = "1";

    public String encode(Instant createdAt, UUID id) {
        // Keep the database timestamp precision in the opaque cursor. Public DTOs still
        // use fixed millisecond UTC formatting, but truncating here can skip same-ms rows.
        String payload = VERSION + "|" + createdAt + "|" + id;
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    public Cursor decode(String value) {
        if (value == null || value.isBlank() || value.length() > 512) {
            throw invalidCursor();
        }
        try {
            String payload = new String(
                    Base64.getUrlDecoder().decode(value),
                    StandardCharsets.UTF_8
            );
            String[] parts = payload.split("\\|", -1);
            if (parts.length != 3 || !VERSION.equals(parts[0])) {
                throw invalidCursor();
            }
            return new Cursor(Instant.parse(parts[1]), UUID.fromString(parts[2]));
        } catch (IllegalArgumentException exception) {
            throw invalidCursor();
        }
    }

    private ApiException invalidCursor() {
        return new ApiException(HttpStatus.BAD_REQUEST, "Invalid audit cursor");
    }

    public record Cursor(Instant createdAt, UUID id) {
    }
}
