package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.alabuga.dislocation.model.TripComment;

import java.util.List;
import java.util.UUID;

public interface TripCommentRepository extends JpaRepository<TripComment, UUID> {

    List<TripComment> findByTripIdOrderByCreatedAtAsc(UUID tripId);
}
