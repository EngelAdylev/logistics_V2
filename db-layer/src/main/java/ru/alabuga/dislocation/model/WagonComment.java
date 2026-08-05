package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Комментарий к вагону (чат-история). Привязан к вагону, а не к рейсу —
 * живёт постоянно, независимо от смены рейсов.
 */
@Entity
@Table(name = "wagon_comment")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WagonComment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "wagon_id", nullable = false)
    private UUID wagonId;

    @Column(nullable = false, length = 100)
    private String author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
