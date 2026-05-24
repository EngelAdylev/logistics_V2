package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import ru.alabuga.dislocation.model.TripStatus;
import ru.alabuga.dislocation.model.WagonTrip;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface WagonTripRepository
        extends JpaRepository<WagonTrip, UUID>,
                QuerydslPredicateExecutor<WagonTrip> {

    @Query("""
        SELECT t FROM WagonTrip t
        WHERE t.wagon.id = :wagonId
          AND t.depStationCode = :depStationCode
          AND CAST(t.startedAt AS LocalDate) = :flightDate
          AND t.status = :status
        """)
    Optional<WagonTrip> findActiveTrip(
            @Param("wagonId") UUID wagonId,
            @Param("depStationCode") String depStationCode,
            @Param("flightDate") LocalDate flightDate,
            @Param("status") TripStatus status
    );
}
