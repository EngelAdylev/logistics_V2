package ru.alabuga.dislocation.dto.trip;

import lombok.Data;
import ru.alabuga.dislocation.filter.WagonTripFilter;

@Data
public class TripPageRequest {
    private WagonTripFilter filter;
    private int page = 0;
    private int size = 50;
}
