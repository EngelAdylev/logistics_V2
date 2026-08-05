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
    private String wagonType;
    private String stationCode;
    private String stationName;
    private String currentTrainNumber;
    private String currentTrainIndex;
    private Integer wagonPosition;
    private Integer remainingDistance;
    private Integer remainingMileage;
    private Integer distanceTraveled;
    private Integer totalDistance;
    private String operationCode;
    private String operationName;
    private Instant lastSeenAt;
    private String flightStartStationCode;
    private String flightStartStationName;
    private Instant flightStartDate;
    private String destinationStationCode;
    private String destinationStationName;
    private String waybillNumber;
    private String sendingNumber;
    private String gngCode;
    private String shipperOkpo;
    private String consigneeOkpo;
    private List<String> containerNumbers;
    private Integer numberLoadedContainers;
    private Integer numberEmptyContainers;
    private Integer cargoWeight;
    private Instant dateArrivalAtDestination;
    private UUID activeTripId;
}
