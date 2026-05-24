package ru.alabuga.dislocation.filter;

import lombok.Data;
import ru.alabuga.dislocation.model.TripStatus;

@Data
public class WagonTripFilter {
    private String wagonNumber;
    private String depStationCode;
    private String dstStationCode;
    private TripStatus status;
}
