package ru.alabuga.analytics.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.alabuga.analytics.model.InboundEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public interface InboundEventRepository extends JpaRepository<InboundEvent, UUID> {

    long countByCreatedAtAfter(LocalDateTime since);

    long countByStatusAndCreatedAtAfter(String status, LocalDateTime since);

    @Query("SELECT COUNT(e) FROM InboundEvent e WHERE e.status <> 'DONE' AND e.createdAt < :threshold")
    long countStuck(LocalDateTime threshold);

    Page<InboundEvent> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since, Pageable pageable);

    @Query("SELECT e FROM InboundEvent e WHERE e.createdAt > :since AND e.status = 'ERROR' ORDER BY e.createdAt DESC")
    Page<InboundEvent> findErrors(LocalDateTime since, Pageable pageable);

    @Query("SELECT e FROM InboundEvent e WHERE e.status <> 'DONE' AND e.createdAt < :threshold ORDER BY e.createdAt DESC")
    Page<InboundEvent> findStuck(LocalDateTime threshold, Pageable pageable);
}
