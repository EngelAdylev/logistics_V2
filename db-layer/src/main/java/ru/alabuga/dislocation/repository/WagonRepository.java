package ru.alabuga.dislocation.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import ru.alabuga.dislocation.model.Wagon;

import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WagonRepository
        extends JpaRepository<Wagon, UUID>,
                QuerydslPredicateExecutor<Wagon> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Wagon> findByWagonNumber(String wagonNumber);

    // Активные вагоны, у которых последняя операция раньше порога (для авто-архива по времени)
    @Query("SELECT w FROM Wagon w WHERE w.activeTrip IS NOT NULL AND w.lastSeenAt IS NOT NULL AND w.lastSeenAt < :cutoff")
    List<Wagon> findStaleActive(@Param("cutoff") Instant cutoff);

    @Query("SELECT w FROM Wagon w WHERE w.stationCode IS NOT NULL AND w.activeTrip IS NOT NULL")
    List<Wagon> findAllWithStation();

    @Query("SELECT w FROM Wagon w WHERE w.currentTrainNumber IS NOT NULL ORDER BY w.currentTrainNumber, w.wagonPosition NULLS LAST")
    List<Wagon> findAllInTrains();

    List<Wagon> findByCurrentTrainNumberAndCurrentTrainIndexOrderByWagonPositionAsc(
            String trainNumber, String trainIndex);

    List<Wagon> findByCurrentTrainNumberAndCurrentTrainIndexIsNullOrderByWagonPositionAsc(
            String trainNumber);
}
