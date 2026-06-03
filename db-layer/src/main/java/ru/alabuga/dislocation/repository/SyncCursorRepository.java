package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.alabuga.dislocation.model.SyncCursor;

public interface SyncCursorRepository extends JpaRepository<SyncCursor, Long> {
}
