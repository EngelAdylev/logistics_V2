package ru.alabuga.dislocation.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class StationDto {
    private String code;
    private String name;
    private BigDecimal lat;
    private BigDecimal lng;
}
