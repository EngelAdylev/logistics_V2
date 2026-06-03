package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Entity
@Immutable
@Table(name = "dislocation")
@Getter
@NoArgsConstructor
public class DislocationRecord {

    @Id
    @Column(name = "_id")
    private UUID id;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "railway_carriage_number")
    private String wagonNumber;

    @Column(name = "waybill_number")
    private String waybillNumber;

    @Column(name = "type_railway_carriage")
    private String wagonType;

    @Column(name = "flight_start_date")
    private LocalDateTime flightStartDate;

    @Column(name = "flight_start_station_code")
    private String flightStartStationCode;

    @Column(name = "flight_end_date")
    private LocalDateTime flightEndDate;

    @Column(name = "destination_station_code")
    private String destinationStationCode;

    @Column(name = "sending_number")
    private String sendingNumber;

    @Column(name = "station_code_performing_operation")
    private String stationCode;

    @Column(name = "operation_code_railway_carriage")
    private String operationCode;

    @Column(name = "date_time_of_operation")
    private LocalDateTime operationDatetime;

    @Column(name = "number_train")
    private String trainNumber;

    @Column(name = "train_index")
    private String trainIndex;

    @Column(name = "number_railway_carriage_on_train")
    private String wagonPosition;

    @Column(name = "remaining_mileage")
    private Integer remainingMileage;

    @Column(name = "distance_traveled")
    private Integer distanceTraveled;

    @Column(name = "total_distance")
    private Integer totalDistance;

    @Column(name = "gng_code")
    private String gngCode;

    @Column(name = "cargo_weight")
    private BigDecimal cargoWeight;

    @Column(name = "shipper")
    private String shipperCode;

    @Column(name = "shipper_okpo")
    private String shipperOkpo;

    @Column(name = "consignee")
    private String consigneeCode;

    @Column(name = "consignee_okpo")
    private String consigneeOkpo;

    @Column(name = "date_time_departure_cargo_receiving_station")
    private LocalDateTime dateDepartureFromSender;

    @Column(name = "date_time_arrival_destination_station")
    private LocalDateTime dateArrivalAtDestination;

    @Column(name = "number_loaded_containers")
    private String numberLoadedContainersRaw;

    @Column(name = "number_empty_containers")
    private String numberEmptyContainersRaw;

    @Column(name = "number_of_seals")
    private String numberOfSealsRaw;

    @Column(name = "container_number1")  private String cn1;
    @Column(name = "container_number2")  private String cn2;
    @Column(name = "container_number3")  private String cn3;
    @Column(name = "container_number4")  private String cn4;
    @Column(name = "container_number5")  private String cn5;
    @Column(name = "container_number6")  private String cn6;
    @Column(name = "container_number7")  private String cn7;
    @Column(name = "container_number8")  private String cn8;
    @Column(name = "container_number9")  private String cn9;
    @Column(name = "container_number10") private String cn10;
    @Column(name = "container_number11") private String cn11;
    @Column(name = "container_number12") private String cn12;

    public List<String> getContainerNumbers() {
        return Stream.of(cn1, cn2, cn3, cn4, cn5, cn6, cn7, cn8, cn9, cn10, cn11, cn12)
                .filter(s -> s != null && !s.isBlank())
                .toList();
    }

    private static Integer parseIntSafe(String s) {
        if (s == null || s.isBlank()) return null;
        try { return Integer.parseInt(s.trim()); } catch (NumberFormatException e) { return null; }
    }

    public Integer getNumberLoadedContainers() { return parseIntSafe(numberLoadedContainersRaw); }
    public Integer getNumberEmptyContainers()  { return parseIntSafe(numberEmptyContainersRaw); }
    public Integer getNumberOfSeals()          { return parseIntSafe(numberOfSealsRaw); }
    public Integer getWagonPositionInt()       { return parseIntSafe(wagonPosition); }
    public Integer getCargoWeightInt()         { return cargoWeight == null ? null : cargoWeight.intValue(); }
}
