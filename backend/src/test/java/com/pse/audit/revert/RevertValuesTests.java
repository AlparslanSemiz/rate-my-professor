package com.pse.audit.revert;

import com.pse.shared.enums.UserStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * These values made a round trip through a JSON column, so an enum comes back as a string
 * and a number as whatever Jackson picked. The comparison is representation-insensitive on
 * purpose; the tests below fix how far that insensitivity goes, including the two places it
 * goes further than is obvious.
 */
class RevertValuesTests {

    private static final UUID FIRST = UUID.fromString("3f2504e0-4f89-11d3-9a0c-0305e82c3301");
    private static final UUID SECOND = UUID.fromString("7c9e6679-7425-40de-944b-e07fc1f90ae7");

    private static Map<String, Object> before(String field, Object value) {
        Map<String, Object> before = new HashMap<>();
        before.put(field, value);
        return before;
    }

    // ---------- sameValue ----------

    @Test
    void sameValue_bothNull_returnsTrue() {
        // When / Then
        assertThat(RevertValues.sameValue(null, null)).isTrue();
    }

    @ParameterizedTest
    @CsvSource({"ACTIVE,", ",ACTIVE"})
    void sameValue_exactlyOneSideNull_returnsFalse(String recorded, String current) {
        // When / Then
        assertThat(RevertValues.sameValue(recorded, current)).isFalse();
    }

    /** The reason the class exists: UserStatus.ACTIVE and "ACTIVE" are one recorded value. */
    @Test
    void sameValue_enumAgainstItsOwnName_returnsTrue() {
        // When / Then
        assertThat(RevertValues.sameValue(UserStatus.ACTIVE, "ACTIVE")).isTrue();
        assertThat(RevertValues.sameValue("ACTIVE", UserStatus.ACTIVE)).isTrue();
    }

    @Test
    void sameValue_differentEnumConstants_returnsFalse() {
        // When / Then
        assertThat(RevertValues.sameValue(UserStatus.ACTIVE, "BLOCKED")).isFalse();
    }

    @Test
    void sameValue_integerAgainstLongOfTheSameValue_returnsTrue() {
        // When / Then -- Jackson may rebuild either side as either type
        assertThat(RevertValues.sameValue(5, 5L)).isTrue();
    }

    @Test
    void sameValue_numberAgainstItsDecimalString_returnsTrue() {
        // When / Then
        assertThat(RevertValues.sameValue(5, "5")).isTrue();
    }

    /**
     * Numbers are compared as longs, so a fractional difference is invisible. Pinned rather
     * than endorsed: nothing recorded today is fractional, and a change here should be a
     * conscious one.
     */
    @Test
    void sameValue_integerAgainstFractionalDouble_returnsTrueBecauseComparisonTruncates() {
        // When / Then
        assertThat(RevertValues.sameValue(1, 1.9)).isTrue();
    }

    @Test
    void sameValue_listsWithTheSameElementsInOrder_returnsTrue() {
        // When / Then
        assertThat(RevertValues.sameValue(List.of("a", "b"), List.of("a", "b"))).isTrue();
    }

    /** Assignments are recorded as ordered lists, so a reordering is a real change. */
    @Test
    void sameValue_listsWithTheSameElementsReordered_returnsFalse() {
        // When / Then
        assertThat(RevertValues.sameValue(List.of("a", "b"), List.of("b", "a"))).isFalse();
    }

    @Test
    void sameValue_listAgainstScalar_returnsFalse() {
        // When / Then
        assertThat(RevertValues.sameValue(List.of("a"), "a")).isFalse();
    }

    @Test
    void sameValue_twoDifferentStrings_returnsFalse() {
        // When / Then
        assertThat(RevertValues.sameValue("old", "new")).isFalse();
    }

    // ---------- asString ----------

    @Test
    void asString_fieldPresent_returnsTheValue() {
        // When / Then
        assertThat(RevertValues.asString(before("username", "alp"), "username")).isEqualTo("alp");
    }

    @Test
    void asString_nonStringValue_returnsItsStringForm() {
        // When / Then
        assertThat(RevertValues.asString(before("credibilityScore", 42), "credibilityScore"))
                .isEqualTo("42");
    }

    @Test
    void asString_fieldAbsentOrNull_returnsNull() {
        // When / Then
        assertThat(RevertValues.asString(Map.of(), "username")).isNull();
        assertThat(RevertValues.asString(before("username", null), "username")).isNull();
    }

    // ---------- asInteger ----------

    @Test
    void asInteger_numberValue_returnsItsIntValue() {
        // When / Then
        assertThat(RevertValues.asInteger(before("score", 42L), "score")).isEqualTo(42);
    }

    @Test
    void asInteger_paddedNumericString_returnsTheParsedValue() {
        // When / Then
        assertThat(RevertValues.asInteger(before("score", " 42 "), "score")).isEqualTo(42);
    }

    @Test
    void asInteger_fieldAbsent_returnsNull() {
        // When / Then
        assertThat(RevertValues.asInteger(Map.of(), "score")).isNull();
    }

    @Test
    void asInteger_nonNumericString_throwsNumberFormatException() {
        // Given
        Map<String, Object> before = before("score", "abc");

        // When / Then
        assertThatThrownBy(() -> RevertValues.asInteger(before, "score"))
                .isInstanceOf(NumberFormatException.class)
                .hasMessageContaining("abc");
    }

    /** Narrowing is silent, which is worth knowing about before a wider column appears. */
    @Test
    void asInteger_valueWiderThanAnInt_truncatesSilently() {
        // Given
        long tooWide = 1L << 40;

        // When / Then
        assertThat(RevertValues.asInteger(before("score", tooWide), "score"))
                .isEqualTo((int) tooWide);
    }

    // ---------- asBoolean ----------

    @Test
    void asBoolean_booleanValue_returnsIt() {
        // When / Then
        assertThat(RevertValues.asBoolean(before("active", true), "active")).isTrue();
    }

    @ParameterizedTest
    @CsvSource({"true,true", "' TRUE ',true", "True,true", "false,false"})
    void asBoolean_stringValue_parsesCaseInsensitively(String recorded, boolean expected) {
        // When / Then
        assertThat(RevertValues.asBoolean(before("active", recorded), "active"))
                .isEqualTo(expected);
    }

    /** Boolean.valueOf maps everything that is not "true" to false -- including "yes". */
    @Test
    void asBoolean_stringThatIsNotTrue_returnsFalseRatherThanThrowing() {
        // When / Then
        assertThat(RevertValues.asBoolean(before("active", "yes"), "active")).isFalse();
    }

    @Test
    void asBoolean_fieldAbsent_returnsNull() {
        // When / Then
        assertThat(RevertValues.asBoolean(Map.of(), "active")).isNull();
    }

    // ---------- asEnum ----------

    @ParameterizedTest
    @CsvSource({"ACTIVE", "active", "' active '", "AcTiVe"})
    void asEnum_valueInAnyCaseOrPadding_resolvesToTheConstant(String recorded) {
        // When / Then
        assertThat(RevertValues.asEnum(before("status", recorded), "status", UserStatus.class))
                .isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    void asEnum_fieldAbsent_returnsNull() {
        // When / Then
        assertThat(RevertValues.asEnum(Map.of(), "status", UserStatus.class)).isNull();
    }

    @Test
    void asEnum_valueThatIsNotAConstant_throwsIllegalArgumentException() {
        // Given
        Map<String, Object> before = before("status", "NOPE");

        // When / Then
        assertThatThrownBy(() -> RevertValues.asEnum(before, "status", UserStatus.class))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No enum constant")
                .hasMessageContaining("NOPE");
    }

    // ---------- asIds ----------

    @Test
    void asIds_listOfUuidStrings_returnsThemInOrder() {
        // Given
        Map<String, Object> before = before("professors", List.of(FIRST.toString(), SECOND.toString()));

        // When
        List<UUID> ids = RevertValues.asIds(before, "professors");

        // Then
        assertThat(ids).containsExactly(FIRST, SECOND);
    }

    @Test
    void asIds_emptyList_returnsEmptyList() {
        // When / Then
        assertThat(RevertValues.asIds(before("professors", List.of()), "professors")).isEmpty();
    }

    /** Absent and "not a list" are the same answer: there is no recorded assignment. */
    @Test
    void asIds_fieldAbsentOrNotACollection_returnsNull() {
        // When / Then
        assertThat(RevertValues.asIds(Map.of(), "professors")).isNull();
        assertThat(RevertValues.asIds(before("professors", "not-a-list"), "professors")).isNull();
        assertThat(RevertValues.asIds(before("professors", null), "professors")).isNull();
    }

    @Test
    void asIds_listContainingSomethingThatIsNotAUuid_throwsIllegalArgumentException() {
        // Given
        Map<String, Object> before = before("professors", List.of("nope"));

        // When / Then
        assertThatThrownBy(() -> RevertValues.asIds(before, "professors"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid UUID string");
    }
}
