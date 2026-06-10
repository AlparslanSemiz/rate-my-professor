package com.pse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

class TokenGeneratorTest {

    @Test
    void generateLoginCodeShouldHaveSixDigits() {
        String code = TokenGenerator.generateOneTimePassword();

        assertEquals(6, code.length());
        assertTrue(code.matches("\\d{6}"));
    }
}