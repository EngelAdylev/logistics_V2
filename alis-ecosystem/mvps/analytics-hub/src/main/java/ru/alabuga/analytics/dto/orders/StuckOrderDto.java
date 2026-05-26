package ru.alabuga.analytics.dto.orders;

import java.time.LocalDateTime;

public record StuckOrderDto(
    String id,
    Integer number,
    String type,           // "RECEIVING" | "SHIPPING"
    String orderStatus,
    String clientId,
    LocalDateTime updatedAt,
    long minutesInStatus
) {}
