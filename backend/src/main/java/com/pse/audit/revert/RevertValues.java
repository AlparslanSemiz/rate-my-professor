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
 *
 * <p>It is order-insensitive for the same reason -- see {@link #sameValue}.
 */
public final class RevertValues {

    private RevertValues() {
    }

    /**
     * <p>Collections are compared as multisets rather than position by position -- BUG-3.
     * The only two collection-valued fields recorded are a lecture's {@code professors} and
     * a professor's {@code lectures}, and both are read out of a {@code Set}, a type that
     * defines no order. Comparing them by position asked whether an unordered collection had
     * been iterated the same way twice: {@code Professor} overrides neither {@code equals}
     * nor {@code hashCode}, so {@code HashSet} buckets by identity hash and the order can
     * differ on every run. A revert of an assignment nobody had touched was then refused as
     * {@code VALUE_CHANGED}, and refused again or not depending on the run -- which is what
     * made the defect look flaky in production rather than broken.
     *
     * <p>Sorted, not de-duplicated: two of the same entry is still a different value from one.
     *
     * @param recorded the recorded
     * @param current the current
     * @return the result
     */
    public static boolean sameValue(Object recorded, Object current) {
        if (recorded == null || current == null) {
            return recorded == null && current == null;
        }
        if (recorded instanceof Collection<?> left && current instanceof Collection<?> right) {
            return asSortedStrings(left).equals(asSortedStrings(right));
        }
        if (recorded instanceof Number left && current instanceof Number right) {
            return left.longValue() == right.longValue();
        }
        return String.valueOf(recorded).equals(String.valueOf(current));
    }

    private static List<String> asSortedStrings(Collection<?> values) {
        return values.stream().map(String::valueOf).sorted().toList();
    }

    /**
     * Returns asString.
     *
     * @param before the before
     * @param field the field
     * @return the result
     */
    public static String asString(Map<String, Object> before, String field) {
        Object value = before.get(field);
        return value == null ? null : String.valueOf(value);
    }

    /**
     * Returns asInteger.
     *
     * @param before the before
     * @param field the field
     * @return the result
     */
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

    /**
     * Returns asBoolean.
     *
     * @param before the before
     * @param field the field
     * @return the result
     */
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

    /**
     * Returns asEnum.
     *
     * @param before the before
     * @param field the field
     * @param type the type
     * @return the result
     * @param <E> the type parameter
     */
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
     *
     * @param before the before
     * @param field the field
     * @return the result
     */
    public static List<UUID> asIds(Map<String, Object> before, String field) {
        Object value = before.get(field);
        if (!(value instanceof Collection<?> values)) {
            return null;
        }
        return values.stream().map(entry -> UUID.fromString(String.valueOf(entry))).toList();
    }
}
