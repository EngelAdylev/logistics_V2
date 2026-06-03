package ru.alabuga.dislocation.dto.invoice;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class EtranInvoiceWebhookDto {

    @JsonProperty("waybill")
    private Waybill waybill;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Waybill {
        @JsonProperty("waybill_number")       private String waybillNumber;
        @JsonProperty("waybill_identifier")   private String waybillIdentifier;
        @JsonProperty("waybill_status")       private String waybillStatus;
        @JsonProperty("waybill_type")         private String waybillType;
        @JsonProperty("shipment_type")        private String shipmentType;
        @JsonProperty("shipment_speed")       private String shipmentSpeed;
        @JsonProperty("delivery_deadline")    private LocalDateTime deliveryDeadline;
        @JsonProperty("waybill_created_at")   private LocalDateTime waybillCreatedAt;
        @JsonProperty("departure_station")    private String departureStation;
        @JsonProperty("departure_station_code") private String departureStationCode;
        @JsonProperty("departure_country")    private String departureCountry;
        @JsonProperty("destination_station")  private String destinationStation;
        @JsonProperty("destination_station_code") private String destinationStationCode;
        @JsonProperty("destination_country")  private String destinationCountry;
        @JsonProperty("shipper_name")         private String shipperName;
        @JsonProperty("shipper_okpo")         private String shipperOkpo;
        @JsonProperty("consignee_name")       private String consigneeName;
        @JsonProperty("consignee_okpo")       private String consigneeOkpo;
        @JsonProperty("payer")                private String payer;
        @JsonProperty("responsible_person")   private String responsiblePerson;

        @JsonProperty("waybill_product")
        private List<WaybillProduct> products;

        @JsonProperty("waybill_railway_carriage")
        private List<WaybillCarriage> carriages;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WaybillProduct {
        @JsonProperty("etsng_code")       private String etsngCode;
        @JsonProperty("etsng_name")       private String etsngName;
        @JsonProperty("gng_code")         private String gngCode;
        @JsonProperty("cargo_full_name")  private String cargoFullName;
        @JsonProperty("cargo_weight")     private BigDecimal cargoWeight;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WaybillCarriage {
        @JsonProperty("railway_number") private String railwayNumber;
    }
}
