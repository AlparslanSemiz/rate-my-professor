package com.pse.audit.service;

import com.pse.shared.util.KeysetCursorCodec;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * The audit log's view of the shared {@link KeysetCursorCodec}: same format, audit-specific
 * error message. Kept as its own type so the audit service reads as if it owned its cursor.
 */
@Component
public class AuditCursorCodec {

    private static final String INVALID = "Invalid audit cursor";

    private final KeysetCursorCodec codec;

    public AuditCursorCodec(KeysetCursorCodec codec) {
        this.codec = codec;
    }

    public String encode(Instant createdAt, UUID id) {
        return codec.encode(createdAt, id);
    }

    public KeysetCursorCodec.Cursor decode(String value) {
        return codec.decode(value, INVALID);
    }
}
