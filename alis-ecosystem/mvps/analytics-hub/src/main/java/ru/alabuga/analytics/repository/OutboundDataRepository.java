package ru.alabuga.analytics.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.alabuga.analytics.model.OutboundData;

import java.time.LocalDateTime;
import java.util.UUID;

public interface OutboundDataRepository extends JpaRepository<OutboundData, UUID> {

    long countByCreatedAtAfter(LocalDateTime since);

    long countBySuccessTrueAndCreatedAtAfter(LocalDateTime since);

    long countBySuccessFalseAndCreatedAtAfter(LocalDateTime since);

    @Query("SELECT COUNT(d) FROM OutboundData d WHERE d.success IS NULL AND d.createdAt < :threshold")
    long countStuck(LocalDateTime threshold);

    Page<OutboundData> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since, Pageable pageable);

    @Query("SELECT d FROM OutboundData d WHERE d.createdAt > :since AND d.success = false ORDER BY d.createdAt DESC")
    Page<OutboundData> findErrors(LocalDateTime since, Pageable pageable);

    @Query("SELECT d FROM OutboundData d WHERE d.success IS NULL AND d.createdAt < :threshold ORDER BY d.createdAt DESC")
    Page<OutboundData> findStuck(LocalDateTime threshold, Pageable pageable);
}
