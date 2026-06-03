package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "etran_invoice")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtranInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "waybill_number", nullable = false, unique = true)
    private String waybillNumber;

    @Column(name = "waybill_identifier")
    private String waybillIdentifier;

    @Column(name = "waybill_status")
    private String waybillStatus;

    @Column(name = "waybill_type")
    private String waybillType;

    @Column(name = "shipment_type")
    private String shipmentType;

    @Column(name = "shipment_speed")
    private String shipmentSpeed;

    @Column(name = "delivery_deadline")
    private Instant deliveryDeadline;

    @Column(name = "waybill_created_at")
    private Instant waybillCreatedAt;

    @Column(name = "departure_station")
    private String departureStation;

    @Column(name = "departure_station_code")
    private String departureStationCode;

    @Column(name = "departure_country")
    private String departureCountry;

    @Column(name = "destination_station")
    private String destinationStation;

    @Column(name = "destination_station_code")
    private String destinationStationCode;

    @Column(name = "destination_country")
    private String destinationCountry;

    @Column(name = "shipper_name", length = 500)
    private String shipperName;

    @Column(name = "shipper_okpo")
    private String shipperOkpo;

    @Column(name = "consignee_name", length = 500)
    private String consigneeName;

    @Column(name = "consignee_okpo")
    private String consigneeOkpo;

    @Column(name = "payer", length = 500)
    private String payer;

    @Column(name = "responsible_person")
    private String responsiblePerson;

    @Column(name = "etsng_code")
    private String etsngCode;

    @Column(name = "etsng_name")
    private String etsngName;

    @Column(name = "gng_code")
    private String gngCode;

    @Column(name = "cargo_weight", precision = 12, scale = 2)
    private BigDecimal cargoWeight;

    @Column(name = "cargo_full_name", columnDefinition = "TEXT")
    private String cargoFullName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_json", columnDefinition = "jsonb")
    private String rawJson;

    @Column(name = "received_at", nullable = false, updatable = false)
    private Instant receivedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (receivedAt == null) receivedAt = now;
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
