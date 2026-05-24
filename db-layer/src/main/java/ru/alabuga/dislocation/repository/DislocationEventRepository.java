package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import ru.alabuga.dislocation.model.DislocationEvent;

import java.util.List;
import java.util.UUID;

public interface DislocationEventRepository
        extends JpaRepository<DislocationEvent, UUID>,
                QuerydslPredicateExecutor<DislocationEvent> {

    boolean existsByRzdId(UUID rzdId);

    @Query("SELECT e FROM DislocationEvent e WHERE e.trip.id = :tripId ORDER BY e.operationDatetime ASC")
    List<DislocationEvent> findByTripIdOrdered(@Param("tripId") UUID tripId);
}
