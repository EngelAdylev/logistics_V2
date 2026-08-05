package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "wagon")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wagon extends AbstractBaseEntity {

    @Column(unique = true, nullable = false)
    private String wagonNumber;

    private String stationCode;
    private String stationName;
    private String currentTrainNumber;
    private String currentTrainIndex;
    private Integer remainingDistance;
    private String operationCode;
    private String operationName;
    private Instant lastSeenAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_trip_id")
    private WagonTrip activeTrip;

    private String destinationStationCode;
    private String shipperOkpo;
    private String consigneeOkpo;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> containerNumbers;

    private Integer cargoWeight;
    private Instant dateArrivalAtDestination;

    // Денормализованные поля из последнего события
    private String wagonType;
    private String waybillNumber;
    private String sendingNumber;
    private Integer wagonPosition;
    private Integer distanceTraveled;
    private Integer totalDistance;
    private Integer remainingMileage;
    private String gngCode;
    private Integer numberLoadedContainers;
    private Integer numberEmptyContainers;
    private Instant flightStartDate;
    private String flightStartStationCode;
    private String flightStartStationName;
    private String destinationStationName;
}
