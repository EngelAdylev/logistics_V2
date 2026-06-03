package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "sync_cursor")
@Getter
@Setter
@NoArgsConstructor
public class SyncCursor {

    @Id
    private Long id;

    @Column(name = "last_processed_at", nullable = false)
    private Instant lastProcessedAt;
}
