package com.pse.shared.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;

public final class UtcDates {

    private static final DateTimeFormatter FORMATTER =
            new DateTimeFormatterBuilder().appendInstant(3).toFormatter();

    private UtcDates() {
    }

    public static String format(LocalDateTime value) {
        return value == null ? null : format(value.toInstant(ZoneOffset.UTC));
    }

    public static String format(Instant value) {
        return value == null ? null : FORMATTER.format(value);
    }
}
