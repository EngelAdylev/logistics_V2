package ru.alabuga.analytics.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Immutable
@Table(name = "shipping_order")
@Getter
public class ShippingOrder {
    @Id
    private UUID id;
    private Integer number;
    private String orderStatus;
    private UUID clientId;
    private String terminalArea;
    private String transportType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime plannedShippingDateTime;
    private LocalDateTime actualShippingDateTime;
}
