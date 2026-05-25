package ru.alabuga.dislocation.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import ru.alabuga.dislocation.model.Wagon;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WagonRepository
        extends JpaRepository<Wagon, UUID>,
                QuerydslPredicateExecutor<Wagon> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Wagon> findByWagonNumber(String wagonNumber);

    @Query("SELECT w FROM Wagon w WHERE w.stationCode IS NOT NULL")
    List<Wagon> findAllWithStation();
}
