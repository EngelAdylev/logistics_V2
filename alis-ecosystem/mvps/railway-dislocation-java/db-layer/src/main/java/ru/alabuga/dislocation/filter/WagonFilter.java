package ru.alabuga.dislocation.filter;

import lombok.Data;

@Data
public class WagonFilter {
    private String wagonNumber;
    private String trainNumber;
    private String stationCode;
    private String operationCode;
    private String destinationStationCode;
    private Boolean hasContainers;
}
