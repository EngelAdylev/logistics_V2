package ru.alabuga.analytics.util;

public final class SystemMapper {

    private SystemMapper() {}

    public static String fromMessageType(String messageType) {
        if (messageType == null) return "DATAREON";
        return switch (messageType) {
            case "CARGO_RECEIVING_TASK", "CARGO_SHIPMENT_TASK" -> "WMS";
            case "RECEIVING_TRANSPORT_MANIFEST", "SHIPMENT_TRANSPORT_MANIFEST" -> "TOS";
            case "CONTRACTOR" -> "1C";
            default -> messageType.startsWith("CLIENT_") ? "1C" : "DATAREON";
        };
    }

    public static String fromEventCode(String eventCode) {
        if (eventCode == null) return "WMS";
        if (eventCode.startsWith("LOAD_") || eventCode.startsWith("UNLOAD_") || eventCode.startsWith("DOCK_")) {
            return "TOS";
        }
        return "WMS";
    }
}
