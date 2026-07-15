package com.pse.shared.util;

import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;


/**
 * Implements secure Hashing Function (Argon2)
 *
 * The encoded string contains:
 *  - algorithm
 *  - version
 *  - parameters (saltLength, hasLength, ...)
 *  - random salt
 *  - password hash
 * => No need to store Salt in separate Attribut in Table
 */
public final class HashGenerator {


    /** Values may be changed
     *  Higher Values => More Security => More Compute Time
     *
     *   saltLength: 16 Byte
     *   hashLength: 32 Byte
     *   parallelism: 1 Thread
     *   memory: 32768 KiB = 32 MiB
     *   iterations: 3
     */
    private static final Argon2PasswordEncoder ENCODER = new Argon2PasswordEncoder(16, 32, 1, 32768, 3);;



    private HashGenerator() {
        //
    }

    public static String hashPassword(String password) {

        return ENCODER.encode(password);

    }

    public static boolean passwordMatchesHash(String password, String hash) {

        return ENCODER.matches(password, hash);

    }


}
