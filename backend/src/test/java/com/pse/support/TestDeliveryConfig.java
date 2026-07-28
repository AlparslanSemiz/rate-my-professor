package com.pse.support;

import com.pse.auth.service.LoginCodeDelivery;
import com.pse.auth.service.LoginSuccessDelivery;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@TestConfiguration
public class TestDeliveryConfig {

    @Bean
    CapturingLoginCodeDelivery capturingLoginCodeDelivery() {
        return new CapturingLoginCodeDelivery();
    }

    @Bean
    LoginSuccessDelivery noOpLoginSuccessDelivery() {
        return (email, ipAddress, userAgent) -> {
        };
    }

    public static final class CapturingLoginCodeDelivery implements LoginCodeDelivery {

        private final Map<String, String> codes = new ConcurrentHashMap<>();

        @Override
        public void send(String email, String code) {
            codes.put(email, code);
        }

        public String codeFor(String email) {
            return codes.get(email);
        }

        public void clear() {
            codes.clear();
        }
    }
}
