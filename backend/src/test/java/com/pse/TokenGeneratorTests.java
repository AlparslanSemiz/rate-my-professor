package com.pse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.pse.auth.service.TokenGenerator;
import org.junit.jupiter.api.Test;

class TokenGeneratorTests {

    @Test
    void generateLoginCodeShouldHaveSixDigits() {
        String code = TokenGenerator.generateOneTimePassword();

        assertEquals(6, code.length());
        assertTrue(code.matches("[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ]{6}"));    
        }
}