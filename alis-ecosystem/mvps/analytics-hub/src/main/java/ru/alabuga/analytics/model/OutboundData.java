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
@Table(name = "outbound_data")
@Getter
public class OutboundData {
    @Id
    private UUID id;
    private UUID rootObjectId;
    private String messageType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean success;
    private String entityType;
    private UUID messageId;
    private Integer responseCode;
    private String errorMessage;
    private String createdBy;
    private Short attempts;
    private LocalDateTime lastAttemptAt;
}
