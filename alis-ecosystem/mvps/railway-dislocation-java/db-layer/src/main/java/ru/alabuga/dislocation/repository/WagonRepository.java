package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import ru.alabuga.dislocation.model.Wagon;

import java.util.Optional;
import java.util.UUID;

public interface WagonRepository
        extends JpaRepository<Wagon, UUID>,
                QuerydslPredicateExecutor<Wagon> {

    Optional<Wagon> findByWagonNumber(String wagonNumber);
}
