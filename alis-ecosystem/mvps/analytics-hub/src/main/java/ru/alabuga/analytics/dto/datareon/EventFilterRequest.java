package ru.alabuga.analytics.dto.datareon;

public record EventFilterRequest(
    String period,    // "1h" | "6h" | "24h", default "1h"
    String status,    // "ALL" | "ERROR" | "STUCK", default "ALL"
    String system,    // "ALL" | "WMS" | "TOS" | "1C" | "DATAREON", default "ALL"
    int page,
    int size
) {
    public EventFilterRequest {
        if (period == null) period = "1h";
        if (status == null) status = "ALL";
        if (system == null) system = "ALL";
        if (size <= 0 || size > 100) size = 50;
    }
}
