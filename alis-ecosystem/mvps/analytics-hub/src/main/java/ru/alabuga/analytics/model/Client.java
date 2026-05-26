package ru.alabuga.analytics.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import org.hibernate.annotations.Immutable;

import java.util.UUID;

@Entity
@Immutable
@Table(name = "client")
@Getter
public class Client {
    @Id
    private UUID id;
    private String code;
    private String name;
    private Boolean active;
}
