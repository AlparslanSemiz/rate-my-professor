package com.pse;

import java.security.SecureRandom;
import java.util.Base64;


/**
 * Generates a secure Token.
 */
public class TokenGenerator {

    private static final SecureRandom secureRandom = new SecureRandom();

    /**
     * 32 Byte long Token => ~ 43 Chars (Base64)
     */
    public static String generateToken() {

        byte[] bytes = new byte[32]; // 256 bits
        secureRandom.nextBytes(bytes);
        


        
        //TODO: OVERWRITE FOR TESTING PURPOSES
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    /**
     * Create 6 Digit One Time Password
     */
    public static String generateOneTimePassword() {

        int code = secureRandom.nextInt(1000000); 
        return String.format("%06d", code);

    }

   
}
