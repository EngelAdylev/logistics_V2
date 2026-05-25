package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import ru.alabuga.dislocation.model.TripStatus;
import ru.alabuga.dislocation.model.WagonTrip;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface WagonTripRepository
        extends JpaRepository<WagonTrip, UUID>,
                QuerydslPredicateExecutor<WagonTrip> {

    @Query("""
        SELECT t FROM WagonTrip t
        WHERE t.wagon.id = :wagonId
          AND t.depStationCode = :depStationCode
          AND t.startedAt >= :startOfDay
          AND t.startedAt < :startOfNextDay
          AND t.status = :status
        """)
    Optional<WagonTrip> findActiveTrip(
            @Param("wagonId") UUID wagonId,
            @Param("depStationCode") String depStationCode,
            @Param("startOfDay") Instant startOfDay,
            @Param("startOfNextDay") Instant startOfNextDay,
            @Param("status") TripStatus status
    );

    long countByStatus(TripStatus status);
}
