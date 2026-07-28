package com.pse.auth.service;

import com.pse.auth.model.OneTimePassword;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.shared.util.HashGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OtpService {

    private final OneTimePasswordRepository repository;
    private final Clock clock;
    private final Duration ttl;

    public OtpService(
            OneTimePasswordRepository repository,
            Clock clock,
            @Value("${app.auth.otp-ttl:PT5M}") Duration ttl
    ) {
        this.repository = repository;
        this.clock = clock;
        this.ttl = ttl;
    }

    @Transactional
    public String issue(String normalizedEmail) {
        repository.consumeOutstandingForEmail(normalizedEmail);

        String code = TokenGenerator.generateOneTimePassword();
        OneTimePassword otp = new OneTimePassword();
        otp.setEmail(normalizedEmail);
        otp.setHash(HashGenerator.hashPassword(code));
        otp.setExpiresAt(LocalDateTime.now(clock).plus(ttl));
        repository.save(otp);
        return code;
    }

    @Transactional
    public void invalidate(String normalizedEmail) {
        repository.consumeOutstandingForEmail(normalizedEmail);
    }

    @Transactional
    public boolean consume(String normalizedEmail, String submittedCode) {
        List<OneTimePassword> candidates =
                repository.findByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        normalizedEmail,
                        LocalDateTime.now(clock)
                );
        for (OneTimePassword candidate : candidates) {
            if (matches(submittedCode, candidate)) {
                candidate.setUsed(true);
                repository.save(candidate);
                return true;
            }
        }
        return false;
    }

    private boolean matches(String submittedCode, OneTimePassword candidate) {
        if (candidate.getHash() != null
                && HashGenerator.passwordMatchesHash(submittedCode, candidate.getHash())) {
            return true;
        }
        if (candidate.getLegacyValue() == null) {
            return false;
        }
        return MessageDigest.isEqual(
                submittedCode.getBytes(StandardCharsets.UTF_8),
                candidate.getLegacyValue().getBytes(StandardCharsets.UTF_8)
        );
    }
}
