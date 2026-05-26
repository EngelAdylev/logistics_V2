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
@Table(name = "inbound_event")
@Getter
public class InboundEvent {
    @Id
    private UUID id;
    private UUID taskId;
    private UUID orderId;
    private String orderNumber;
    private String terminalArea;
    private String eventCode;
    private String eventName;
    private LocalDateTime eventDateTime;
    private String status;
    private String statusDetails;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
