package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "railway_station")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RailwayStation {

    @Id
    private String code;

    private String name;
    private BigDecimal lat;
    private BigDecimal lng;
}
