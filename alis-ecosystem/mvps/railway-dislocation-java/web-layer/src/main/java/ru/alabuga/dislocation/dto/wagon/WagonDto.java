package ru.alabuga.dislocation.dto.wagon;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class WagonDto {
    private UUID id;
    private String wagonNumber;
    private String stationCode;
    private String stationName;
    private String currentTrainNumber;
    private String currentTrainIndex;
    private Integer remainingDistance;
    private String operationCode;
    private String operationName;
    private Instant lastSeenAt;
    private String destinationStationCode;
    private String shipperOkpo;
    private String consigneeOkpo;
    private List<String> containerNumbers;
    private Integer cargoWeight;
    private Instant dateArrivalAtDestination;
    private UUID activeTripId;
}
