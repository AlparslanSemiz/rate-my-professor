package com.pse;

import java.security.SecureRandom;


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
        return "12345678910";

        /* 
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
        */
    }

   
}
