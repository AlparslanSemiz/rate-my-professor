package com.pse.audit.revert;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Reading the {@code before}/{@code after} halves of an audit entry back out.
 *
 * <p>The values went into a JSON column as enums, numbers, booleans and lists, and come back
 * as whatever Jackson chose to rebuild them into. The comparison here is therefore
 * representation-insensitive on purpose: {@code UserStatus.ACTIVE} and the string
 * {@code "ACTIVE"} are the same recorded value, and treating them as different would make
 * every entry look stale.
 */
public final class RevertValues {

    private RevertValues() {
    }

    public static boolean sameValue(Object recorded, Object current) {
        if (recorded == null || current == null) {
            return recorded == null && current == null;
        }
        if (recorded instanceof Collection<?> left && current instanceof Collection<?> right) {
            return asStrings(left).equals(asStrings(right));
        }
        if (recorded instanceof Number left && current instanceof Number right) {
            return left.longValue() == right.longValue();
        }
        return String.valueOf(recorded).equals(String.valueOf(current));
    }

    private static List<String> asStrings(Collection<?> values) {
        return values.stream().map(String::valueOf).toList();
    }

    public static String asString(Map<String, Object> before, String field) {
        Object value = before.get(field);
        return value == null ? null : String.valueOf(value);
    }

    public static Integer asInteger(Map<String, Object> before, String field) {
        Object value = before.get(field);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.valueOf(String.valueOf(value).trim());
    }

    public static Boolean asBoolean(Map<String, Object> before, String field) {
        Object value = before.get(field);
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.valueOf(String.valueOf(value).trim());
    }

    public static <E extends Enum<E>> E asEnum(
            Map<String, Object> before,
            String field,
            Class<E> type
    ) {
        String value = asString(before, field);
        return value == null ? null : Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT));
    }

    /**
     * A recorded list of ids. The catalogue records lecture and professor assignments as
     * lists of UUID strings, which is what a reassignment has to be given back.
     */
    public static List<UUID> asIds(Map<String, Object> before, String field) {
        Object value = before.get(field);
        if (!(value instanceof Collection<?> values)) {
            return null;
        }
        return values.stream().map(entry -> UUID.fromString(String.valueOf(entry))).toList();
    }
}
