package com.pse.shared.util;

public final class SqlLike {

    /** The escape character callers must pass to their LIKE predicate. */
    public static final char ESCAPE = '\\';

    private SqlLike() {
    }

    /**
     * Escapes the wildcards in a user-supplied search term so a query for {@code 100%}
     * searches for that text rather than matching everything. Callers must pass {@code '\'}
     * as the LIKE escape character.
     */
    public static String escape(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
