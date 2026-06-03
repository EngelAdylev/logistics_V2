package ru.alabuga.dislocation.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.alabuga.dislocation.model.DislocationRecord;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface DislocationRecordRepository extends JpaRepository<DislocationRecord, UUID> {

    @Query("SELECT r FROM DislocationRecord r WHERE r.createdAt > :since AND r.wagonNumber IS NOT NULL ORDER BY r.createdAt ASC")
    List<DislocationRecord> findNewRecords(@Param("since") Instant since, Pageable pageable);
}
