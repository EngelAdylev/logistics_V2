package ru.alabuga.dislocation.util;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    private static final long EXPIRY_MS = 24L * 60 * 60 * 1000;

    @Value("${jwt.secret}")
    private String secret;

    @PostConstruct
    public void validateSecret() {
        if (secret == null || secret.getBytes().length < 32) {
            throw new IllegalStateException(
                "JWT_SECRET must be at least 32 characters long (current: " +
                (secret == null ? 0 : secret.length()) + " chars). " +
                "Generate with: openssl rand -hex 32"
            );
        }
        log.info("JWT secret configured, length: {} chars", secret.length());
    }

    public String generate(String username, String role) {
        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(username)
                    .claim("role", role)
                    .issueTime(new Date())
                    .expirationTime(new Date(System.currentTimeMillis() + EXPIRY_MS))
                    .build();

            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            jwt.sign(new MACSigner(secret.getBytes()));
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("JWT generation failed", e);
        }
    }

    public JWTClaimsSet validate(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!jwt.verify(new MACVerifier(secret.getBytes()))) return null;
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            if (claims.getExpirationTime().before(new Date())) return null;
            return claims;
        } catch (Exception e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return null;
        }
    }
}
