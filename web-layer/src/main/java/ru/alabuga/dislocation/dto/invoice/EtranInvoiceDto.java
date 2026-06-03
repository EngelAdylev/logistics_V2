package ru.alabuga.dislocation.dto.invoice;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class EtranInvoiceDto {
    private UUID    id;
    private String  waybillNumber;
    private String  waybillStatus;
    private String  waybillType;
    private String  shipmentType;
    private String  shipmentSpeed;
    private Instant deliveryDeadline;
    private Instant waybillCreatedAt;
    private String  departureStation;
    private String  departureStationCode;
    private String  departureCountry;
    private String  destinationStation;
    private String  destinationStationCode;
    private String  destinationCountry;
    private String  shipperName;
    private String  shipperOkpo;
    private String  consigneeName;
    private String  consigneeOkpo;
    private String  payer;
    private String  responsiblePerson;
    private String  etsngCode;
    private String  etsngName;
    private String  gngCode;
    private BigDecimal cargoWeight;
    private String  cargoFullName;
    private Instant receivedAt;
    private Instant updatedAt;
}
