package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "dislocation_event", schema = "dislocation")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DislocationEvent extends AbstractBaseEntity {

    @Column(unique = true, nullable = false)
    private UUID rzdId;

    @Column(nullable = false)
    private Instant receivedAt;

    @Column(nullable = false)
    private String wagonNumber;

    private String waybillNumber;
    private String wagonType;
    private Instant flightStartDate;
    private String flightStartStationCode;
    private Instant flightEndDate;
    private String destinationStationCode;
    private String sendingNumber;
    private String stationCode;
    private String operationCode;
    private Instant operationDatetime;
    private String trainNumber;
    private String trainIndex;
    private Integer wagonPosition;
    private Integer remainingDistance;
    private Integer distanceTraveled;
    private Integer totalDistance;
    private String gngCode;
    private Integer cargoWeight;
    private String shipperCode;
    private String shipperOkpo;
    private String consigneeCode;
    private String consigneeOkpo;
    private Instant dateDepartureFromSender;
    private Instant dateArrivalAtDestination;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> containerNumbers;

    private Integer numberLoadedContainers;
    private Integer numberEmptyContainers;
    private Integer numberOfSeals;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private WagonTrip trip;
}
