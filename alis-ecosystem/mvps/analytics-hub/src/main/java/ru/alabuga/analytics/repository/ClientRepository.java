package ru.alabuga.analytics.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.alabuga.analytics.model.Client;

import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {
}
