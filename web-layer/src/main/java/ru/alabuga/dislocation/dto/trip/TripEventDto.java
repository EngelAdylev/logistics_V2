package ru.alabuga.dislocation.dto.trip;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TripEventDto {
    private UUID id;
    private String stationCode;
    private String operationCode;
    private String operationName;
    private Instant operationDatetime;
    private Integer remainingDistance;
    private String trainNumber;
    private List<String> containerNumbers;
}
