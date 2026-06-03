package ru.alabuga.dislocation.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.auth.AuthResponse;
import ru.alabuga.dislocation.dto.auth.LoginRequest;
import ru.alabuga.dislocation.model.AppUser;
import ru.alabuga.dislocation.repository.AppUserRepository;
import ru.alabuga.dislocation.util.JwtUtil;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostConstruct
    public void initDefaults() {
        try {
            long count = userRepo.count();
            log.info("app_user table has {} rows", count);
            if (count == 0) {
                userRepo.save(AppUser.builder()
                        .username("admin")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .role("ADMIN")
                        .build());
                userRepo.save(AppUser.builder()
                        .username("user")
                        .passwordHash(passwordEncoder.encode("user123"))
                        .role("USER")
                        .build());
                log.info("Created default users: admin / user");
            } else {
                log.info("Default users already exist, skipping");
            }
        } catch (Exception e) {
            log.error("Failed to init default users", e);
        }
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = userRepo.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    log.warn("Login failed: user '{}' not found", request.getUsername());
                    return new RuntimeException("Invalid credentials");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed: wrong password for user '{}'", request.getUsername());
            throw new RuntimeException("Invalid credentials");
        }

        String token;
        try {
            token = jwtUtil.generate(user.getUsername(), user.getRole());
        } catch (Exception e) {
            log.error("JWT generation failed for user '{}': {}", user.getUsername(), e.getMessage());
            throw new RuntimeException("JWT generation failed");
        }
        log.info("Login successful for user '{}' (role={})", user.getUsername(), user.getRole());
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }
}
