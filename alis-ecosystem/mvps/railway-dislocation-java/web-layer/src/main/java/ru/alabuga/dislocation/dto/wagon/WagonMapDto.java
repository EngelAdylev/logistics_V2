package ru.alabuga.dislocation.dto.wagon;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class WagonMapDto {
    private UUID id;
    private String wagonNumber;
    private BigDecimal lat;
    private BigDecimal lng;
    private Integer remainingDistance;
    private String operationCode;
    private String trainNumber;
    private String destinationStationCode;
    private UUID activeTripId;
}
