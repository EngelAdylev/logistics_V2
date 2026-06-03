package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.alabuga.dislocation.model.AppUser;

import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByUsername(String username);
}
