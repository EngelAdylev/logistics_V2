package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import ru.alabuga.dislocation.model.RailwayStation;

public interface RailwayStationRepository
        extends JpaRepository<RailwayStation, String>,
                QuerydslPredicateExecutor<RailwayStation> {
}
