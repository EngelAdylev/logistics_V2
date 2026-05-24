package ru.alabuga.dislocation.dto.webhook;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Data
public class DislocationWebhookPayload {

    @JsonProperty("_id")
    private UUID rzdId;

    @JsonProperty("railway_carriage_number")
    private String wagonNumber;

    @JsonProperty("waybill_number")
    private String waybillNumber;

    @JsonProperty("type_railway_carriage")
    private String wagonType;

    @JsonProperty("flight_start_date")
    private Instant flightStartDate;

    @JsonProperty("flight_start_station_code")
    private String flightStartStationCode;

    @JsonProperty("flight_end_date")
    private Instant flightEndDate;

    @JsonProperty("destination_station_code")
    private String destinationStationCode;

    @JsonProperty("sending_number")
    private String sendingNumber;

    @JsonProperty("station_code_performing_operation")
    private String stationCode;

    @JsonProperty("operation_code_railway_carriage")
    private String operationCode;

    @JsonProperty("date_time_of_operation")
    private Instant operationDatetime;

    @JsonProperty("number_train")
    private String trainNumber;

    @JsonProperty("train_index")
    private String trainIndex;

    @JsonProperty("number_railway_carriage_on_train")
    private Integer wagonPosition;

    @JsonProperty("remaining_distance")
    private Integer remainingDistance;

    @JsonProperty("distance_traveled")
    private Integer distanceTraveled;

    @JsonProperty("total_distance")
    private Integer totalDistance;

    @JsonProperty("gng_code")
    private String gngCode;

    @JsonProperty("cargo_weight")
    private Integer cargoWeight;

    @JsonProperty("shipper")
    private String shipperCode;

    @JsonProperty("shipper_okpo")
    private String shipperOkpo;

    @JsonProperty("consignee")
    private String consigneeCode;

    @JsonProperty("consignee_okpo")
    private String consigneeOkpo;

    @JsonProperty("date_time_departure_cargo_receiving_station")
    private Instant dateDepartureFromSender;

    @JsonProperty("date_time_arrival_destination_station")
    private Instant dateArrivalAtDestination;

    @JsonProperty("number_loaded_containers")
    private Integer numberLoadedContainers;

    @JsonProperty("number_empty_containers")
    private Integer numberEmptyContainers;

    @JsonProperty("number_of_seals")
    private Integer numberOfSeals;

    // container_number1 .. container_number12
    @JsonProperty("container_number1")
    private String cn1;

    @JsonProperty("container_number2")
    private String cn2;

    @JsonProperty("container_number3")
    private String cn3;

    @JsonProperty("container_number4")
    private String cn4;

    @JsonProperty("container_number5")
    private String cn5;

    @JsonProperty("container_number6")
    private String cn6;

    @JsonProperty("container_number7")
    private String cn7;

    @JsonProperty("container_number8")
    private String cn8;

    @JsonProperty("container_number9")
    private String cn9;

    @JsonProperty("container_number10")
    private String cn10;

    @JsonProperty("container_number11")
    private String cn11;

    @JsonProperty("container_number12")
    private String cn12;

    public List<String> getContainerNumbers() {
        return Stream.of(cn1, cn2, cn3, cn4, cn5, cn6,
                         cn7, cn8, cn9, cn10, cn11, cn12)
                .filter(s -> s != null && !s.isBlank())
                .toList();
    }
}
