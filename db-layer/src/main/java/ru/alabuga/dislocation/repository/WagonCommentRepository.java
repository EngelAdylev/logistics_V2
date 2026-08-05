package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.alabuga.dislocation.model.WagonComment;

import java.util.List;
import java.util.UUID;

public interface WagonCommentRepository extends JpaRepository<WagonComment, UUID> {
    List<WagonComment> findByWagonIdOrderByCreatedAtAsc(UUID wagonId);
}
