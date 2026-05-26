package ru.alabuga.analytics.dto.orders;

public record OrderSummaryDto(
    long draft,
    long onReview,
    long accepted,
    long inProgress,
    long done,
    String type    // "RECEIVING" | "SHIPPING"
) {}
