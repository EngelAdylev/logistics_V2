package ru.alabuga.analytics.dto.orders;

public record OrderFilterRequest(
    String type    // "ALL" | "RECEIVING" | "SHIPPING", default "ALL"
) {
    public OrderFilterRequest {
        if (type == null) type = "ALL";
    }
}
