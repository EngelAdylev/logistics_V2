package ru.alabuga.dislocation.dto.trip;

import lombok.Builder;
import lombok.Data;
import ru.alabuga.dislocation.model.TripStatus;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TripDto {
    private UUID id;
    private String wagonNumber;
    private String depStationCode;
    private String depStationName;
    private String dstStationCode;
    private String dstStationName;
    private Instant startedAt;
    private Instant finishedAt;
    private TripStatus status;
}
