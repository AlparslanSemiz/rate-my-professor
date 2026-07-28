package com.pse.security;

import com.pse.auth.model.Token;
import com.pse.auth.repository.TokenRepository;
import com.pse.moderation.model.Admin;
import com.pse.moderation.repository.AdminRepository;
import com.pse.shared.util.HashGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class TokenAuthenticationService {

    private final TokenRepository tokenRepository;
    private final AdminRepository adminRepository;
    private final Clock clock;

    public TokenAuthenticationService(
            TokenRepository tokenRepository,
            AdminRepository adminRepository,
            Clock clock
    ) {
        this.tokenRepository = tokenRepository;
        this.adminRepository = adminRepository;
        this.clock = clock;
    }

    @Transactional
    public Optional<AuthenticatedUser> authenticate(String rawToken) {
        if (rawToken == null || rawToken.isBlank() || rawToken.length() > 512) {
            return Optional.empty();
        }

        LocalDateTime now = LocalDateTime.now(clock);
        String hash = HashGenerator.hashToken(rawToken);
        Token token = tokenRepository
                .findByHashAndRevokedFalseAndExpiresAtAfter(hash, now)
                .orElseGet(() -> upgradeLegacyToken(rawToken, hash, now).orElse(null));

        if (token == null || token.getStudent() == null) {
            return Optional.empty();
        }

        Admin admin = adminRepository.findByStudent(token.getStudent()).orElse(null);
        return Optional.of(new AuthenticatedUser(token.getStudent(), token, admin));
    }

    private Optional<Token> upgradeLegacyToken(String rawToken, String hash, LocalDateTime now) {
        Optional<Token> legacy = tokenRepository
                .findByLegacyValueAndRevokedFalseAndExpiresAtAfter(rawToken, now);
        legacy.ifPresent(token -> {
            token.setHash(hash);
            token.setLegacyValue(null);
            tokenRepository.save(token);
        });
        return legacy;
    }
}
