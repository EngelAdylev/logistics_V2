package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wagon_trip")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WagonTrip extends AbstractBaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wagon_id", nullable = false)
    private Wagon wagon;

    private String depStationCode;
    private String depStationName;
    private String dstStationCode;
    private String dstStationName;

    private Instant startedAt;
    private Instant finishedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TripStatus status = TripStatus.ACTIVE;
}
