# Railway Dislocation Java — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать систему отслеживания ж/д вагонов на Java/Spring Boot с картой на Leaflet — полная замена Python/FastAPI версии.

**Architecture:** Отдельный Spring Boot сервис (multi-module Gradle: db-layer + web-layer), своя схема `dislocation` в PostgreSQL ALIS. Данные поступают только через webhook от РЖД — один POST = одна транзакция без планировщика. Frontend — React 18 + TypeScript + MUI v6 + Leaflet.

**Tech Stack:** Java 17, Spring Boot 3.3, Gradle, Hibernate JPA + QueryDSL 5, Liquibase, Keycloak OAuth2, springdoc, PostgreSQL, React 18, TypeScript, Vite, MUI v6, react-leaflet, axios, react-router-dom 6, TanStack React Query v5.

**Spec:** `docs/superpowers/specs/2026-05-24-railway-dislocation-java-design.md`

**Project root:** `mvps/railway-dislocation-java/`

---

## Task 1: Gradle multi-module scaffolding

**Files:**
- Create: `mvps/railway-dislocation-java/settings.gradle`
- Create: `mvps/railway-dislocation-java/build.gradle`
- Create: `mvps/railway-dislocation-java/gradle.properties`
- Create: `mvps/railway-dislocation-java/db-layer/build.gradle`
- Create: `mvps/railway-dislocation-java/web-layer/build.gradle`
- Create: `mvps/railway-dislocation-java/web-layer/src/main/java/ru/alabuga/dislocation/DislocationApplication.java`
- Create: `mvps/railway-dislocation-java/web-layer/src/main/resources/application.yml`

- [ ] **Step 1: Создать структуру папок**

```bash
cd mvps/railway-dislocation-java
mkdir -p db-layer/src/main/java/ru/alabuga/dislocation
mkdir -p db-layer/src/main/resources
mkdir -p web-layer/src/main/java/ru/alabuga/dislocation
mkdir -p web-layer/src/main/resources
mkdir -p web-layer/src/test/java/ru/alabuga/dislocation
```

- [ ] **Step 2: Создать `settings.gradle`**

```groovy
rootProject.name = 'railway-dislocation'
include 'db-layer'
include 'web-layer'
```

- [ ] **Step 3: Создать `gradle.properties`**

```properties
org.gradle.jvmargs=-Xmx2048m
org.gradle.parallel=true
```

- [ ] **Step 4: Создать корневой `build.gradle`**

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.3.0' apply false
    id 'io.spring.dependency-management' version '1.1.5' apply false
}

subprojects {
    apply plugin: 'java'
    apply plugin: 'io.spring.dependency-management'

    group = 'ru.alabuga'
    version = '1.0.0'
    java.sourceCompatibility = JavaVersion.VERSION_17

    repositories {
        mavenCentral()
    }

    dependencyManagement {
        imports {
            mavenBom "org.springframework.boot:spring-boot-dependencies:3.3.0"
        }
    }

    configurations {
        compileOnly { extendsFrom annotationProcessor }
    }
}
```

- [ ] **Step 5: Создать `db-layer/build.gradle`**

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'com.querydsl:querydsl-jpa:5.1.0:jakarta'
    annotationProcessor 'com.querydsl:querydsl-apt:5.1.0:jakarta'
    annotationProcessor 'jakarta.persistence:jakarta.persistence-api:3.1.0'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    runtimeOnly 'org.postgresql:postgresql'
}

sourceSets {
    main {
        java {
            srcDirs += "$buildDir/generated/sources/annotationProcessor/java/main"
        }
    }
}
```

- [ ] **Step 6: Создать `web-layer/build.gradle`**

```groovy
apply plugin: 'org.springframework.boot'

dependencies {
    implementation project(':db-layer')
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
    implementation 'org.springframework.boot:spring-boot-starter-liquibase'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0'
    implementation 'com.opencsv:opencsv:5.9'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    runtimeOnly 'org.postgresql:postgresql'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testImplementation 'com.h2database:h2'
}
```

- [ ] **Step 7: Создать `DislocationApplication.java`**

```java
package ru.alabuga.dislocation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DislocationApplication {
    public static void main(String[] args) {
        SpringApplication.run(DislocationApplication.class, args);
    }
}
```

- [ ] **Step 8: Создать `application.yml`**

```yaml
spring:
  application:
    name: railway-dislocation
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/alis}
    username: ${DATABASE_USERNAME:alis}
    password: ${DATABASE_PASSWORD:alis}
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_schema: dislocation
        dialect: org.hibernate.dialect.PostgreSQLDialect
  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.xml
    default-schema: dislocation
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_ISSUER_URI:http://localhost:8080/realms/KIS}

server:
  port: ${SERVER_PORT:8080}
  servlet:
    context-path: /api

springdoc:
  swagger-ui:
    path: /swagger-ui.html
```

- [ ] **Step 9: Проверить что проект компилируется**

```bash
cd mvps/railway-dislocation-java
./gradlew compileJava
```

Ожидаем: `BUILD SUCCESSFUL`

- [ ] **Step 10: Commit**

```bash
git add mvps/railway-dislocation-java/
git commit -m "feat: scaffold railway dislocation Java project"
```

---

## Task 2: Liquibase migrations — 4 таблицы

**Files:**
- Create: `web-layer/src/main/resources/db/changelog/db.changelog-master.xml`
- Create: `web-layer/src/main/resources/db/changelog/V1__create_schema.sql`

- [ ] **Step 1: Создать `db.changelog-master.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <include file="classpath:db/changelog/V1__create_schema.sql"
             relativeToChangelogFile="false"/>
</databaseChangeLog>
```

- [ ] **Step 2: Создать `V1__create_schema.sql`**

Внимание: `wagon` и `wagon_trip` имеют циклическую FK — создаём FK отдельно после обеих таблиц.

```sql
CREATE SCHEMA IF NOT EXISTS dislocation;

CREATE TABLE dislocation.railway_station (
    code    VARCHAR(20)   PRIMARY KEY,
    name    VARCHAR(255),
    lat     DECIMAL(9,6),
    lng     DECIMAL(9,6)
);

-- wagon_trip создаём без FK на wagon (добавим ниже)
CREATE TABLE dislocation.wagon_trip (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    wagon_id         UUID          NOT NULL,
    dep_station_code VARCHAR(20),
    dep_station_name VARCHAR(255),
    dst_station_code VARCHAR(20),
    dst_station_name VARCHAR(255),
    started_at       TIMESTAMP,
    finished_at      TIMESTAMP,
    status           VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMP     DEFAULT NOW(),
    updated_at       TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE dislocation.wagon (
    id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    wagon_number                VARCHAR(20)  UNIQUE NOT NULL,
    station_code                VARCHAR(20),
    station_name                VARCHAR(255),
    current_train_number        VARCHAR(50),
    current_train_index         VARCHAR(100),
    remaining_distance          INTEGER,
    operation_code              VARCHAR(10),
    operation_name              VARCHAR(100),
    last_seen_at                TIMESTAMP,
    active_trip_id              UUID         REFERENCES dislocation.wagon_trip(id),
    destination_station_code    VARCHAR(20),
    shipper_okpo                VARCHAR(20),
    consignee_okpo              VARCHAR(20),
    container_numbers           JSONB,
    cargo_weight                INTEGER,
    date_arrival_at_destination TIMESTAMP,
    created_at                  TIMESTAMP    DEFAULT NOW(),
    updated_at                  TIMESTAMP    DEFAULT NOW()
);

-- Теперь добавляем FK wagon_trip → wagon
ALTER TABLE dislocation.wagon_trip
    ADD CONSTRAINT fk_wagon_trip_wagon
    FOREIGN KEY (wagon_id) REFERENCES dislocation.wagon(id);

CREATE TABLE dislocation.dislocation_event (
    id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    rzd_id                       UUID        UNIQUE NOT NULL,
    received_at                  TIMESTAMP   NOT NULL,
    wagon_number                 VARCHAR(20) NOT NULL,
    waybill_number               VARCHAR(50),
    wagon_type                   VARCHAR(10),
    flight_start_date            TIMESTAMP,
    flight_start_station_code    VARCHAR(20),
    flight_end_date              TIMESTAMP,
    destination_station_code     VARCHAR(20),
    sending_number               VARCHAR(50),
    station_code                 VARCHAR(20),
    operation_code               VARCHAR(10),
    operation_datetime           TIMESTAMP,
    train_number                 VARCHAR(50),
    train_index                  VARCHAR(100),
    wagon_position               INTEGER,
    remaining_distance           INTEGER,
    distance_traveled            INTEGER,
    total_distance               INTEGER,
    gng_code                     VARCHAR(20),
    cargo_weight                 INTEGER,
    shipper_code                 VARCHAR(20),
    shipper_okpo                 VARCHAR(20),
    consignee_code               VARCHAR(20),
    consignee_okpo               VARCHAR(20),
    date_departure_from_sender   TIMESTAMP,
    date_arrival_at_destination  TIMESTAMP,
    container_numbers            JSONB,
    number_loaded_containers     INTEGER,
    number_empty_containers      INTEGER,
    number_of_seals              INTEGER,
    trip_id                      UUID        REFERENCES dislocation.wagon_trip(id),
    created_at                   TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_event_wagon_number ON dislocation.dislocation_event(wagon_number);
CREATE INDEX idx_event_trip_id      ON dislocation.dislocation_event(trip_id);
CREATE INDEX idx_event_rzd_id       ON dislocation.dislocation_event(rzd_id);
CREATE INDEX idx_trip_wagon_id      ON dislocation.wagon_trip(wagon_id);
CREATE INDEX idx_trip_status        ON dislocation.wagon_trip(status);
CREATE INDEX idx_wagon_number       ON dislocation.wagon(wagon_number);
```

- [ ] **Step 3: Commit**

```bash
git add mvps/railway-dislocation-java/web-layer/src/main/resources/db/
git commit -m "feat: add Liquibase migrations for dislocation schema"
```

---

## Task 3: Сущности (Entity)

**Files:**
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/model/AbstractBaseEntity.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/model/RailwayStation.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/model/TripStatus.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/model/WagonTrip.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/model/Wagon.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/model/DislocationEvent.java`

- [ ] **Step 1: Создать `AbstractBaseEntity.java`**

```java
package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AbstractBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
```

- [ ] **Step 2: Создать `RailwayStation.java`**

RailwayStation использует `code` (VARCHAR) как PK, а не UUID — не наследует AbstractBaseEntity.

```java
package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "railway_station", schema = "dislocation")
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
```

- [ ] **Step 3: Создать `TripStatus.java`**

```java
package ru.alabuga.dislocation.model;

public enum TripStatus {
    ACTIVE,
    COMPLETED
}
```

- [ ] **Step 4: Создать `WagonTrip.java`**

```java
package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wagon_trip", schema = "dislocation")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WagonTrip extends AbstractBaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wagon_id", nullable = false)
    private Wagon wagon;

    private String depStationCode;
    private String depStationName;
    private String dstStationCode;
    private String dstStationName;

    private Instant startedAt;
    private Instant finishedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TripStatus status = TripStatus.ACTIVE;
}
```

- [ ] **Step 5: Создать `Wagon.java`**

```java
package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "wagon", schema = "dislocation")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wagon extends AbstractBaseEntity {

    @Column(unique = true, nullable = false)
    private String wagonNumber;

    private String stationCode;
    private String stationName;
    private String currentTrainNumber;
    private String currentTrainIndex;
    private Integer remainingDistance;
    private String operationCode;
    private String operationName;
    private Instant lastSeenAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_trip_id")
    private WagonTrip activeTrip;

    private String destinationStationCode;
    private String shipperOkpo;
    private String consigneeOkpo;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> containerNumbers;

    private Integer cargoWeight;
    private Instant dateArrivalAtDestination;
}
```

- [ ] **Step 6: Создать `DislocationEvent.java`**

```java
package ru.alabuga.dislocation.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "dislocation_event", schema = "dislocation")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DislocationEvent extends AbstractBaseEntity {

    @Column(unique = true, nullable = false)
    private UUID rzdId;

    @Column(nullable = false)
    private Instant receivedAt;

    @Column(nullable = false)
    private String wagonNumber;

    private String waybillNumber;
    private String wagonType;
    private Instant flightStartDate;
    private String flightStartStationCode;
    private Instant flightEndDate;
    private String destinationStationCode;
    private String sendingNumber;
    private String stationCode;
    private String operationCode;
    private Instant operationDatetime;
    private String trainNumber;
    private String trainIndex;
    private Integer wagonPosition;
    private Integer remainingDistance;
    private Integer distanceTraveled;
    private Integer totalDistance;
    private String gngCode;
    private Integer cargoWeight;
    private String shipperCode;
    private String shipperOkpo;
    private String consigneeCode;
    private String consigneeOkpo;
    private Instant dateDepartureFromSender;
    private Instant dateArrivalAtDestination;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> containerNumbers;

    private Integer numberLoadedContainers;
    private Integer numberEmptyContainers;
    private Integer numberOfSeals;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private WagonTrip trip;
}
```

- [ ] **Step 7: Добавить `@EnableJpaAuditing` в конфиг приложения**

В `DislocationApplication.java` добавить аннотацию:

```java
@SpringBootApplication
@EnableJpaAuditing
public class DislocationApplication { ... }
```

- [ ] **Step 8: Commit**

```bash
git add mvps/railway-dislocation-java/db-layer/
git commit -m "feat: add JPA entities for dislocation domain"
```

---

## Task 4: Репозитории, QueryDSL конфиг, DAO-сервисы

**Files:**
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/config/QuerydslConfig.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/repository/RailwayStationRepository.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/repository/WagonRepository.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/repository/WagonTripRepository.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/repository/DislocationEventRepository.java`

- [ ] **Step 1: Создать `QuerydslConfig.java`** (в db-layer)

```java
package ru.alabuga.dislocation.config;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuerydslConfig {

    @Bean
    public JPAQueryFactory queryFactory(EntityManager entityManager) {
        return new JPAQueryFactory(entityManager);
    }
}
```

- [ ] **Step 2: Создать `RailwayStationRepository.java`**

```java
package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import ru.alabuga.dislocation.model.RailwayStation;

public interface RailwayStationRepository
        extends JpaRepository<RailwayStation, String>,
                QuerydslPredicateExecutor<RailwayStation> {
}
```

- [ ] **Step 3: Создать `WagonRepository.java`**

```java
package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import ru.alabuga.dislocation.model.Wagon;

import java.util.Optional;
import java.util.UUID;

public interface WagonRepository
        extends JpaRepository<Wagon, UUID>,
                QuerydslPredicateExecutor<Wagon> {

    Optional<Wagon> findByWagonNumber(String wagonNumber);
}
```

- [ ] **Step 4: Создать `WagonTripRepository.java`**

```java
package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import ru.alabuga.dislocation.model.TripStatus;
import ru.alabuga.dislocation.model.WagonTrip;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface WagonTripRepository
        extends JpaRepository<WagonTrip, UUID>,
                QuerydslPredicateExecutor<WagonTrip> {

    @Query("""
        SELECT t FROM WagonTrip t
        WHERE t.wagon.id = :wagonId
          AND t.depStationCode = :depStationCode
          AND CAST(t.startedAt AS LocalDate) = :flightDate
          AND t.status = :status
        """)
    Optional<WagonTrip> findActiveTrip(
            @Param("wagonId") UUID wagonId,
            @Param("depStationCode") String depStationCode,
            @Param("flightDate") LocalDate flightDate,
            @Param("status") TripStatus status
    );
}
```

- [ ] **Step 5: Создать `DislocationEventRepository.java`**

```java
package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import ru.alabuga.dislocation.model.DislocationEvent;

import java.util.List;
import java.util.UUID;

public interface DislocationEventRepository
        extends JpaRepository<DislocationEvent, UUID>,
                QuerydslPredicateExecutor<DislocationEvent> {

    boolean existsByRzdId(UUID rzdId);

    @Query("SELECT e FROM DislocationEvent e WHERE e.trip.id = :tripId ORDER BY e.operationDatetime ASC")
    List<DislocationEvent> findByTripIdOrdered(@Param("tripId") UUID tripId);
}
```

- [ ] **Step 6: Сгенерировать Q-классы QueryDSL**

```bash
cd mvps/railway-dislocation-java
./gradlew :db-layer:compileJava
```

Ожидаем появления файлов:
```
db-layer/build/generated/sources/annotationProcessor/java/main/
  ru/alabuga/dislocation/model/QWagon.java
  ru/alabuga/dislocation/model/QWagonTrip.java
  ru/alabuga/dislocation/model/QDislocationEvent.java
  ru/alabuga/dislocation/model/QRailwayStation.java
```

- [ ] **Step 7: Commit**

```bash
git add mvps/railway-dislocation-java/db-layer/
git commit -m "feat: add repositories and QueryDSL config"
```

---

## Task 5: QueryDSL фильтры и предикаты

**Files:**
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/filter/WagonFilter.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/filter/WagonTripFilter.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/predicate/WagonPredicate.java`
- Create: `db-layer/src/main/java/ru/alabuga/dislocation/predicate/WagonTripPredicate.java`

- [ ] **Step 1: Создать `WagonFilter.java`**

```java
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
```

- [ ] **Step 2: Создать `WagonTripFilter.java`**

```java
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
```

- [ ] **Step 3: Создать `WagonPredicate.java`**

```java
package ru.alabuga.dislocation.predicate;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import ru.alabuga.dislocation.filter.WagonFilter;
import ru.alabuga.dislocation.model.QWagon;

@Component
@RequiredArgsConstructor
public class WagonPredicate {

    public Predicate build(WagonFilter filter) {
        if (filter == null) return new BooleanBuilder();

        QWagon w = QWagon.wagon;
        BooleanBuilder builder = new BooleanBuilder();

        if (StringUtils.hasText(filter.getWagonNumber())) {
            builder.and(w.wagonNumber.containsIgnoreCase(filter.getWagonNumber()));
        }
        if (StringUtils.hasText(filter.getTrainNumber())) {
            builder.and(w.currentTrainNumber.eq(filter.getTrainNumber()));
        }
        if (StringUtils.hasText(filter.getStationCode())) {
            builder.and(w.stationCode.eq(filter.getStationCode()));
        }
        if (StringUtils.hasText(filter.getOperationCode())) {
            builder.and(w.operationCode.eq(filter.getOperationCode()));
        }
        if (StringUtils.hasText(filter.getDestinationStationCode())) {
            builder.and(w.destinationStationCode.eq(filter.getDestinationStationCode()));
        }
        if (Boolean.TRUE.equals(filter.getHasContainers())) {
            builder.and(w.containerNumbers.isNotNull());
        }

        return builder;
    }
}
```

- [ ] **Step 4: Создать `WagonTripPredicate.java`**

```java
package ru.alabuga.dislocation.predicate;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import ru.alabuga.dislocation.filter.WagonTripFilter;
import ru.alabuga.dislocation.model.QWagonTrip;

@Component
@RequiredArgsConstructor
public class WagonTripPredicate {

    public Predicate build(WagonTripFilter filter) {
        if (filter == null) return new BooleanBuilder();

        QWagonTrip t = QWagonTrip.wagonTrip;
        BooleanBuilder builder = new BooleanBuilder();

        if (StringUtils.hasText(filter.getWagonNumber())) {
            builder.and(t.wagon.wagonNumber.containsIgnoreCase(filter.getWagonNumber()));
        }
        if (StringUtils.hasText(filter.getDepStationCode())) {
            builder.and(t.depStationCode.eq(filter.getDepStationCode()));
        }
        if (StringUtils.hasText(filter.getDstStationCode())) {
            builder.and(t.dstStationCode.eq(filter.getDstStationCode()));
        }
        if (filter.getStatus() != null) {
            builder.and(t.status.eq(filter.getStatus()));
        }

        return builder;
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add mvps/railway-dislocation-java/db-layer/
git commit -m "feat: add QueryDSL filters and predicates"
```

---

## Task 6: Keycloak Security Config

**Files:**
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/config/SecurityConfig.java`

- [ ] **Step 1: Создать `SecurityConfig.java`**

```java
package ru.alabuga.dislocation.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/webhook/**").permitAll()   // РЖД не шлёт токен
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt -> {}));
        return http.build();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add mvps/railway-dislocation-java/web-layer/src/main/java/ru/alabuga/dislocation/config/SecurityConfig.java
git commit -m "feat: configure Keycloak JWT security"
```

---

## Task 7: Webhook DTO — маппинг полей CSV в Java

**Files:**
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/dto/webhook/DislocationWebhookPayload.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/util/OperationCodeUtil.java`

- [ ] **Step 1: Создать `DislocationWebhookPayload.java`**

Поля маппятся из snake_case CSV через `@JsonProperty`. Container_number1..12 собираются в List через helper-метод.

```java
package ru.alabuga.dislocation.dto.webhook;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Data
public class DislocationWebhookPayload {

    @JsonProperty("_id")
    private UUID rzdId;

    @JsonProperty("railway_carriage_number")
    private String wagonNumber;

    @JsonProperty("waybill_number")
    private String waybillNumber;

    @JsonProperty("type_railway_carriage")
    private String wagonType;

    @JsonProperty("flight_start_date")
    private Instant flightStartDate;

    @JsonProperty("flight_start_station_code")
    private String flightStartStationCode;

    @JsonProperty("flight_end_date")
    private Instant flightEndDate;

    @JsonProperty("destination_station_code")
    private String destinationStationCode;

    @JsonProperty("sending_number")
    private String sendingNumber;

    @JsonProperty("station_code_performing_operation")
    private String stationCode;

    @JsonProperty("operation_code_railway_carriage")
    private String operationCode;

    @JsonProperty("date_time_of_operation")
    private Instant operationDatetime;

    @JsonProperty("number_train")
    private String trainNumber;

    @JsonProperty("train_index")
    private String trainIndex;

    @JsonProperty("number_railway_carriage_on_train")
    private Integer wagonPosition;

    @JsonProperty("remaining_distance")
    private Integer remainingDistance;

    @JsonProperty("distance_traveled")
    private Integer distanceTraveled;

    @JsonProperty("total_distance")
    private Integer totalDistance;

    @JsonProperty("gng_code")
    private String gngCode;

    @JsonProperty("cargo_weight")
    private Integer cargoWeight;

    @JsonProperty("shipper")
    private String shipperCode;

    @JsonProperty("shipper_okpo")
    private String shipperOkpo;

    @JsonProperty("consignee")
    private String consigneeCode;

    @JsonProperty("consignee_okpo")
    private String consigneeOkpo;

    @JsonProperty("date_time_departure_cargo_receiving_station")
    private Instant dateDepartureFromSender;

    @JsonProperty("date_time_arrival_destination_station")
    private Instant dateArrivalAtDestination;

    @JsonProperty("number_loaded_containers")
    private Integer numberLoadedContainers;

    @JsonProperty("number_empty_containers")
    private Integer numberEmptyContainers;

    @JsonProperty("number_of_seals")
    private Integer numberOfSeals;

    // container_number1 .. container_number12
    @JsonProperty("container_number1")  private String cn1;
    @JsonProperty("container_number2")  private String cn2;
    @JsonProperty("container_number3")  private String cn3;
    @JsonProperty("container_number4")  private String cn4;
    @JsonProperty("container_number5")  private String cn5;
    @JsonProperty("container_number6")  private String cn6;
    @JsonProperty("container_number7")  private String cn7;
    @JsonProperty("container_number8")  private String cn8;
    @JsonProperty("container_number9")  private String cn9;
    @JsonProperty("container_number10") private String cn10;
    @JsonProperty("container_number11") private String cn11;
    @JsonProperty("container_number12") private String cn12;

    public List<String> getContainerNumbers() {
        return Stream.of(cn1, cn2, cn3, cn4, cn5, cn6,
                         cn7, cn8, cn9, cn10, cn11, cn12)
                .filter(s -> s != null && !s.isBlank())
                .toList();
    }
}
```

- [ ] **Step 2: Создать `OperationCodeUtil.java`**

```java
package ru.alabuga.dislocation.util;

import java.util.Map;

public final class OperationCodeUtil {

    private static final Map<String, String> NAMES = Map.of(
        "96", "Прибыл к месту назначения",
        "20", "Убыл со станции",
        "61", "Задержан на промежуточной",
        "80", "Расформирован",
        "85", "Прицеплен"
    );

    private OperationCodeUtil() {}

    public static String getName(String code) {
        if (code == null) return null;
        return NAMES.getOrDefault(code, "Операция " + code);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add mvps/railway-dislocation-java/web-layer/
git commit -m "feat: add webhook DTO and operation code mapping"
```

---

## Task 8: DislocationProcessingService (TDD — ядро системы)

**Files:**
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/service/DislocationProcessingService.java`
- Create: `web-layer/src/test/java/ru/alabuga/dislocation/service/DislocationProcessingServiceTest.java`

- [ ] **Step 1: Написать failing-тест — дублирующееся событие игнорируется**

```java
package ru.alabuga.dislocation.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import ru.alabuga.dislocation.dto.webhook.DislocationWebhookPayload;
import ru.alabuga.dislocation.repository.DislocationEventRepository;
import ru.alabuga.dislocation.repository.WagonRepository;
import ru.alabuga.dislocation.repository.WagonTripRepository;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DislocationProcessingServiceTest {

    @Mock DislocationEventRepository eventRepo;
    @Mock WagonRepository wagonRepo;
    @Mock WagonTripRepository tripRepo;

    @InjectMocks DislocationProcessingService service;

    @BeforeEach
    void setUp() { MockitoAnnotations.openMocks(this); }

    @Test
    void shouldIgnoreDuplicateEvent() {
        DislocationWebhookPayload payload = new DislocationWebhookPayload();
        payload.setRzdId(UUID.randomUUID());
        payload.setWagonNumber("42691234");
        payload.setOperationCode("20");
        payload.setOperationDatetime(Instant.now());

        when(eventRepo.existsByRzdId(payload.getRzdId())).thenReturn(true);

        service.process(payload);

        verify(eventRepo, never()).save(any());
        verify(wagonRepo, never()).save(any());
    }
}
```

- [ ] **Step 2: Запустить тест — убедиться что FAIL**

```bash
./gradlew :web-layer:test --tests "ru.alabuga.dislocation.service.DislocationProcessingServiceTest"
```

Ожидаем: `DislocationProcessingService` не существует — `COMPILATION ERROR`

- [ ] **Step 3: Создать `DislocationProcessingService.java`**

```java
package ru.alabuga.dislocation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.webhook.DislocationWebhookPayload;
import ru.alabuga.dislocation.model.*;
import ru.alabuga.dislocation.repository.*;
import ru.alabuga.dislocation.util.OperationCodeUtil;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
@Transactional
public class DislocationProcessingService {

    private final DislocationEventRepository eventRepo;
    private final WagonRepository wagonRepo;
    private final WagonTripRepository tripRepo;

    public void process(DislocationWebhookPayload payload) {
        // 1. Идемпотентность
        if (eventRepo.existsByRzdId(payload.getRzdId())) {
            return;
        }

        // 2. Сохраняем сырое событие
        DislocationEvent event = toEvent(payload);
        event = eventRepo.save(event);

        // 3. Upsert вагона
        Wagon wagon = wagonRepo.findByWagonNumber(payload.getWagonNumber())
                .orElse(Wagon.builder().wagonNumber(payload.getWagonNumber()).build());

        if (wagon.getLastSeenAt() == null
                || payload.getOperationDatetime().isAfter(wagon.getLastSeenAt())) {
            updateWagon(wagon, payload);
        }
        wagon = wagonRepo.save(wagon);

        // 4. Найти или создать рейс
        WagonTrip trip = findOrCreateTrip(wagon, payload);

        // 5. Привязать событие к рейсу
        event.setTrip(trip);
        eventRepo.save(event);

        // 6. Закрыть рейс если вагон прибыл к пункту назначения
        if ("96".equals(payload.getOperationCode())
                && payload.getStationCode() != null
                && payload.getStationCode().equals(trip.getDstStationCode())) {
            trip.setStatus(TripStatus.COMPLETED);
            trip.setFinishedAt(Instant.now());
            tripRepo.save(trip);
            wagon.setActiveTrip(null);
            wagonRepo.save(wagon);
        }
    }

    private WagonTrip findOrCreateTrip(Wagon wagon, DislocationWebhookPayload p) {
        if (p.getFlightStartDate() == null || p.getFlightStartStationCode() == null) {
            return createNewTrip(wagon, p);
        }
        LocalDate flightDate = p.getFlightStartDate()
                .atZone(ZoneOffset.UTC).toLocalDate();

        return tripRepo.findActiveTrip(
                wagon.getId(),
                p.getFlightStartStationCode(),
                flightDate,
                TripStatus.ACTIVE
        ).orElseGet(() -> createNewTrip(wagon, p));
    }

    private WagonTrip createNewTrip(Wagon wagon, DislocationWebhookPayload p) {
        WagonTrip trip = WagonTrip.builder()
                .wagon(wagon)
                .depStationCode(p.getFlightStartStationCode())
                .dstStationCode(p.getDestinationStationCode())
                .startedAt(p.getFlightStartDate() != null
                        ? p.getFlightStartDate() : Instant.now())
                .status(TripStatus.ACTIVE)
                .build();
        trip = tripRepo.save(trip);
        wagon.setActiveTrip(trip);
        return trip;
    }

    private void updateWagon(Wagon wagon, DislocationWebhookPayload p) {
        wagon.setStationCode(p.getStationCode());
        wagon.setCurrentTrainNumber(p.getTrainNumber());
        wagon.setCurrentTrainIndex(p.getTrainIndex());
        wagon.setRemainingDistance(p.getRemainingDistance());
        wagon.setOperationCode(p.getOperationCode());
        wagon.setOperationName(OperationCodeUtil.getName(p.getOperationCode()));
        wagon.setLastSeenAt(p.getOperationDatetime());
        wagon.setDestinationStationCode(p.getDestinationStationCode());
        wagon.setShipperOkpo(p.getShipperOkpo());
        wagon.setConsigneeOkpo(p.getConsigneeOkpo());
        wagon.setContainerNumbers(p.getContainerNumbers());
        wagon.setCargoWeight(p.getCargoWeight());
        wagon.setDateArrivalAtDestination(p.getDateArrivalAtDestination());
    }

    private DislocationEvent toEvent(DislocationWebhookPayload p) {
        return DislocationEvent.builder()
                .rzdId(p.getRzdId())
                .receivedAt(Instant.now())
                .wagonNumber(p.getWagonNumber())
                .waybillNumber(p.getWaybillNumber())
                .wagonType(p.getWagonType())
                .flightStartDate(p.getFlightStartDate())
                .flightStartStationCode(p.getFlightStartStationCode())
                .flightEndDate(p.getFlightEndDate())
                .destinationStationCode(p.getDestinationStationCode())
                .sendingNumber(p.getSendingNumber())
                .stationCode(p.getStationCode())
                .operationCode(p.getOperationCode())
                .operationDatetime(p.getOperationDatetime())
                .trainNumber(p.getTrainNumber())
                .trainIndex(p.getTrainIndex())
                .wagonPosition(p.getWagonPosition())
                .remainingDistance(p.getRemainingDistance())
                .distanceTraveled(p.getDistanceTraveled())
                .totalDistance(p.getTotalDistance())
                .gngCode(p.getGngCode())
                .cargoWeight(p.getCargoWeight())
                .shipperCode(p.getShipperCode())
                .shipperOkpo(p.getShipperOkpo())
                .consigneeCode(p.getConsigneeCode())
                .consigneeOkpo(p.getConsigneeOkpo())
                .dateDepartureFromSender(p.getDateDepartureFromSender())
                .dateArrivalAtDestination(p.getDateArrivalAtDestination())
                .containerNumbers(p.getContainerNumbers())
                .numberLoadedContainers(p.getNumberLoadedContainers())
                .numberEmptyContainers(p.getNumberEmptyContainers())
                .numberOfSeals(p.getNumberOfSeals())
                .build();
    }
}
```

- [ ] **Step 4: Запустить тест — убедиться что PASS**

```bash
./gradlew :web-layer:test --tests "ru.alabuga.dislocation.service.DislocationProcessingServiceTest"
```

Ожидаем: `BUILD SUCCESSFUL`, тест `shouldIgnoreDuplicateEvent` — PASS

- [ ] **Step 5: Добавить тест — создание нового рейса**

```java
@Test
void shouldCreateNewTripForNewWagon() {
    DislocationWebhookPayload payload = new DislocationWebhookPayload();
    payload.setRzdId(UUID.randomUUID());
    payload.setWagonNumber("42691234");
    payload.setOperationCode("20");
    payload.setOperationDatetime(Instant.now());
    payload.setFlightStartStationCode("194300");
    payload.setFlightStartDate(Instant.now());
    payload.setDestinationStationCode("648400");
    payload.setTrainNumber("3221");

    when(eventRepo.existsByRzdId(any())).thenReturn(false);
    when(eventRepo.save(any())).thenAnswer(i -> i.getArgument(0));
    when(wagonRepo.findByWagonNumber("42691234")).thenReturn(java.util.Optional.empty());
    when(wagonRepo.save(any())).thenAnswer(i -> {
        Wagon w = i.getArgument(0);
        // симулируем установку id после сохранения
        return w;
    });
    when(tripRepo.findActiveTrip(any(), any(), any(), any())).thenReturn(java.util.Optional.empty());
    when(tripRepo.save(any())).thenAnswer(i -> i.getArgument(0));

    service.process(payload);

    verify(tripRepo, times(1)).save(any(WagonTrip.class));
    verify(wagonRepo, atLeast(1)).save(any(Wagon.class));
}
```

- [ ] **Step 6: Запустить все тесты — PASS**

```bash
./gradlew :web-layer:test --tests "ru.alabuga.dislocation.service.DislocationProcessingServiceTest"
```

- [ ] **Step 7: Добавить тест — закрытие рейса при прибытии**

```java
@Test
void shouldCloseTripWhenWagonArrivesAtDestination() {
    UUID wagonId = UUID.randomUUID();
    UUID tripId = UUID.randomUUID();

    Wagon existingWagon = Wagon.builder().wagonNumber("42691234").build();
    // рефлексией или через Hibernate proxy не установить id в unit-тесте,
    // поэтому проверяем косвенно через verify

    WagonTrip existingTrip = WagonTrip.builder()
            .wagon(existingWagon)
            .dstStationCode("648400")
            .depStationCode("194300")
            .startedAt(Instant.now().minusSeconds(3600))
            .status(TripStatus.ACTIVE)
            .build();

    DislocationWebhookPayload payload = new DislocationWebhookPayload();
    payload.setRzdId(UUID.randomUUID());
    payload.setWagonNumber("42691234");
    payload.setOperationCode("96");
    payload.setOperationDatetime(Instant.now());
    payload.setStationCode("648400");          // прибыл на пункт назначения
    payload.setFlightStartStationCode("194300");
    payload.setFlightStartDate(Instant.now().minusSeconds(3600));
    payload.setDestinationStationCode("648400");

    when(eventRepo.existsByRzdId(any())).thenReturn(false);
    when(eventRepo.save(any())).thenAnswer(i -> i.getArgument(0));
    when(wagonRepo.findByWagonNumber("42691234")).thenReturn(java.util.Optional.of(existingWagon));
    when(wagonRepo.save(any())).thenAnswer(i -> i.getArgument(0));
    when(tripRepo.findActiveTrip(any(), eq("194300"), any(), eq(TripStatus.ACTIVE)))
            .thenReturn(java.util.Optional.of(existingTrip));
    when(tripRepo.save(any())).thenAnswer(i -> i.getArgument(0));

    service.process(payload);

    verify(tripRepo, atLeastOnce()).save(argThat(t ->
            t instanceof WagonTrip trip && TripStatus.COMPLETED.equals(trip.getStatus())
    ));
}
```

- [ ] **Step 8: Запустить все тесты — PASS**

```bash
./gradlew :web-layer:test --tests "ru.alabuga.dislocation.service.DislocationProcessingServiceTest"
```

- [ ] **Step 9: Commit**

```bash
git add mvps/railway-dislocation-java/web-layer/
git commit -m "feat: implement DislocationProcessingService with tests"
```

---

## Task 9: Webhook контроллер

**Files:**
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/controller/DislocationWebhookController.java`

- [ ] **Step 1: Создать `DislocationWebhookController.java`**

```java
package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.webhook.DislocationWebhookPayload;
import ru.alabuga.dislocation.service.DislocationProcessingService;

@Tag(name = "webhook")
@RestController
@RequestMapping("/webhook")
@RequiredArgsConstructor
@Slf4j
public class DislocationWebhookController {

    private final DislocationProcessingService processingService;

    @Operation(summary = "Приём пакета дислокации от РЖД")
    @PostMapping("/dislocation")
    public ResponseEntity<Void> receiveDislocation(
            @RequestBody DislocationWebhookPayload payload) {
        log.debug("Received dislocation event: rzdId={}, wagon={}",
                payload.getRzdId(), payload.getWagonNumber());
        processingService.process(payload);
        return ResponseEntity.ok().build();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add mvps/railway-dislocation-java/web-layer/src/main/java/ru/alabuga/dislocation/controller/DislocationWebhookController.java
git commit -m "feat: add webhook controller for RZD dislocation events"
```

---

## Task 10: Wagon API

**Files:**
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/dto/wagon/WagonDto.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/dto/wagon/WagonMapDto.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/dto/wagon/WagonPageRequest.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/service/WagonService.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/controller/WagonController.java`

- [ ] **Step 1: Создать `WagonDto.java`**

```java
package ru.alabuga.dislocation.dto.wagon;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class WagonDto {
    private UUID id;
    private String wagonNumber;
    private String stationCode;
    private String stationName;
    private String currentTrainNumber;
    private String currentTrainIndex;
    private Integer remainingDistance;
    private String operationCode;
    private String operationName;
    private Instant lastSeenAt;
    private String destinationStationCode;
    private String shipperOkpo;
    private String consigneeOkpo;
    private List<String> containerNumbers;
    private Integer cargoWeight;
    private Instant dateArrivalAtDestination;
    private UUID activeTripId;
}
```

- [ ] **Step 2: Создать `WagonMapDto.java`** — лёгкий DTO только для карты

```java
package ru.alabuga.dislocation.dto.wagon;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class WagonMapDto {
    private UUID id;
    private String wagonNumber;
    private BigDecimal lat;
    private BigDecimal lng;
    private Integer remainingDistance;
    private String operationCode;
    private String trainNumber;
    private String destinationStationCode;
}
```

- [ ] **Step 3: Создать `WagonPageRequest.java`**

```java
package ru.alabuga.dislocation.dto.wagon;

import lombok.Data;
import ru.alabuga.dislocation.filter.WagonFilter;

@Data
public class WagonPageRequest {
    private WagonFilter filter;
    private int page = 0;
    private int size = 50;
}
```

- [ ] **Step 4: Создать `WagonService.java`**

```java
package ru.alabuga.dislocation.service;

import com.querydsl.core.types.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.wagon.WagonDto;
import ru.alabuga.dislocation.dto.wagon.WagonMapDto;
import ru.alabuga.dislocation.dto.wagon.WagonPageRequest;
import ru.alabuga.dislocation.model.Wagon;
import ru.alabuga.dislocation.predicate.WagonPredicate;
import ru.alabuga.dislocation.repository.RailwayStationRepository;
import ru.alabuga.dislocation.repository.WagonRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WagonService {

    private final WagonRepository wagonRepo;
    private final RailwayStationRepository stationRepo;
    private final WagonPredicate wagonPredicate;

    public Page<WagonDto> getPage(WagonPageRequest request) {
        Predicate predicate = wagonPredicate.build(request.getFilter());
        PageRequest pageRequest = PageRequest.of(request.getPage(), request.getSize());
        return wagonRepo.findAll(predicate, pageRequest).map(this::toDto);
    }

    public WagonDto getById(UUID id) {
        return wagonRepo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Wagon not found: " + id));
    }

    public List<WagonMapDto> getForMap() {
        return wagonRepo.findAll().stream()
                .filter(w -> w.getStationCode() != null)
                .map(w -> {
                    WagonMapDto.WagonMapDtoBuilder dto = WagonMapDto.builder()
                            .id(w.getId())
                            .wagonNumber(w.getWagonNumber())
                            .remainingDistance(w.getRemainingDistance())
                            .operationCode(w.getOperationCode())
                            .trainNumber(w.getCurrentTrainNumber())
                            .destinationStationCode(w.getDestinationStationCode());

                    stationRepo.findById(w.getStationCode()).ifPresent(s -> {
                        dto.lat(s.getLat());
                        dto.lng(s.getLng());
                    });

                    return dto.build();
                })
                .filter(d -> d.getLat() != null)
                .toList();
    }

    private WagonDto toDto(Wagon w) {
        return WagonDto.builder()
                .id(w.getId())
                .wagonNumber(w.getWagonNumber())
                .stationCode(w.getStationCode())
                .stationName(w.getStationName())
                .currentTrainNumber(w.getCurrentTrainNumber())
                .currentTrainIndex(w.getCurrentTrainIndex())
                .remainingDistance(w.getRemainingDistance())
                .operationCode(w.getOperationCode())
                .operationName(w.getOperationName())
                .lastSeenAt(w.getLastSeenAt())
                .destinationStationCode(w.getDestinationStationCode())
                .shipperOkpo(w.getShipperOkpo())
                .consigneeOkpo(w.getConsigneeOkpo())
                .containerNumbers(w.getContainerNumbers())
                .cargoWeight(w.getCargoWeight())
                .dateArrivalAtDestination(w.getDateArrivalAtDestination())
                .activeTripId(w.getActiveTrip() != null ? w.getActiveTrip().getId() : null)
                .build();
    }
}
```

- [ ] **Step 5: Создать `WagonController.java`**

```java
package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.wagon.WagonDto;
import ru.alabuga.dislocation.dto.wagon.WagonMapDto;
import ru.alabuga.dislocation.dto.wagon.WagonPageRequest;
import ru.alabuga.dislocation.service.WagonService;

import java.util.List;
import java.util.UUID;

@Tag(name = "wagons")
@RestController
@RequestMapping("/wagons")
@RequiredArgsConstructor
public class WagonController {

    private final WagonService wagonService;

    @Operation(summary = "Список вагонов с фильтрами и пагинацией")
    @PostMapping("/page")
    public Page<WagonDto> getPage(@RequestBody WagonPageRequest request) {
        return wagonService.getPage(request);
    }

    @Operation(summary = "Вагон по ID")
    @GetMapping("/{id}")
    public WagonDto getById(@PathVariable UUID id) {
        return wagonService.getById(id);
    }

    @Operation(summary = "Все вагоны для карты (лёгкий формат)")
    @GetMapping("/map")
    public List<WagonMapDto> getForMap() {
        return wagonService.getForMap();
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add mvps/railway-dislocation-java/web-layer/
git commit -m "feat: add wagon API (page, detail, map)"
```

---

## Task 11: WagonTrip API

**Files:**
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/dto/trip/TripDto.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/dto/trip/TripEventDto.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/dto/trip/TripPageRequest.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/service/TripService.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/controller/TripController.java`

- [ ] **Step 1: Создать `TripDto.java`**

```java
package ru.alabuga.dislocation.dto.trip;

import lombok.Builder;
import lombok.Data;
import ru.alabuga.dislocation.model.TripStatus;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TripDto {
    private UUID id;
    private String wagonNumber;
    private String depStationCode;
    private String depStationName;
    private String dstStationCode;
    private String dstStationName;
    private Instant startedAt;
    private Instant finishedAt;
    private TripStatus status;
}
```

- [ ] **Step 2: Создать `TripEventDto.java`** — одна операция из истории рейса

```java
package ru.alabuga.dislocation.dto.trip;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TripEventDto {
    private UUID id;
    private String stationCode;
    private String operationCode;
    private String operationName;
    private Instant operationDatetime;
    private Integer remainingDistance;
    private String trainNumber;
    private List<String> containerNumbers;
}
```

- [ ] **Step 3: Создать `TripPageRequest.java`**

```java
package ru.alabuga.dislocation.dto.trip;

import lombok.Data;
import ru.alabuga.dislocation.filter.WagonTripFilter;

@Data
public class TripPageRequest {
    private WagonTripFilter filter;
    private int page = 0;
    private int size = 50;
}
```

- [ ] **Step 4: Создать `TripService.java`**

```java
package ru.alabuga.dislocation.service;

import com.querydsl.core.types.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.trip.TripDto;
import ru.alabuga.dislocation.dto.trip.TripEventDto;
import ru.alabuga.dislocation.dto.trip.TripPageRequest;
import ru.alabuga.dislocation.model.DislocationEvent;
import ru.alabuga.dislocation.model.WagonTrip;
import ru.alabuga.dislocation.predicate.WagonTripPredicate;
import ru.alabuga.dislocation.repository.DislocationEventRepository;
import ru.alabuga.dislocation.repository.WagonTripRepository;
import ru.alabuga.dislocation.util.OperationCodeUtil;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TripService {

    private final WagonTripRepository tripRepo;
    private final DislocationEventRepository eventRepo;
    private final WagonTripPredicate tripPredicate;

    public Page<TripDto> getPage(TripPageRequest request) {
        Predicate predicate = tripPredicate.build(request.getFilter());
        PageRequest pageRequest = PageRequest.of(request.getPage(), request.getSize());
        return tripRepo.findAll(predicate, pageRequest).map(this::toDto);
    }

    public TripDto getById(UUID id) {
        return tripRepo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Trip not found: " + id));
    }

    public List<TripEventDto> getEvents(UUID tripId) {
        return eventRepo.findByTripIdOrdered(tripId)
                .stream()
                .map(this::toEventDto)
                .toList();
    }

    private TripDto toDto(WagonTrip t) {
        return TripDto.builder()
                .id(t.getId())
                .wagonNumber(t.getWagon() != null ? t.getWagon().getWagonNumber() : null)
                .depStationCode(t.getDepStationCode())
                .depStationName(t.getDepStationName())
                .dstStationCode(t.getDstStationCode())
                .dstStationName(t.getDstStationName())
                .startedAt(t.getStartedAt())
                .finishedAt(t.getFinishedAt())
                .status(t.getStatus())
                .build();
    }

    private TripEventDto toEventDto(DislocationEvent e) {
        return TripEventDto.builder()
                .id(e.getId())
                .stationCode(e.getStationCode())
                .operationCode(e.getOperationCode())
                .operationName(OperationCodeUtil.getName(e.getOperationCode()))
                .operationDatetime(e.getOperationDatetime())
                .remainingDistance(e.getRemainingDistance())
                .trainNumber(e.getTrainNumber())
                .containerNumbers(e.getContainerNumbers())
                .build();
    }
}
```

- [ ] **Step 5: Создать `TripController.java`**

```java
package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.trip.TripDto;
import ru.alabuga.dislocation.dto.trip.TripEventDto;
import ru.alabuga.dislocation.dto.trip.TripPageRequest;
import ru.alabuga.dislocation.service.TripService;

import java.util.List;
import java.util.UUID;

@Tag(name = "trips")
@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @Operation(summary = "Список рейсов с фильтрами")
    @PostMapping("/page")
    public Page<TripDto> getPage(@RequestBody TripPageRequest request) {
        return tripService.getPage(request);
    }

    @Operation(summary = "Рейс по ID")
    @GetMapping("/{id}")
    public TripDto getById(@PathVariable UUID id) {
        return tripService.getById(id);
    }

    @Operation(summary = "Хронология операций рейса")
    @GetMapping("/{id}/events")
    public List<TripEventDto> getEvents(@PathVariable UUID id) {
        return tripService.getEvents(id);
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add mvps/railway-dislocation-java/web-layer/
git commit -m "feat: add trip API (page, detail, events timeline)"
```

---

## Task 12: Station + Admin API

**Files:**
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/dto/StationDto.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/service/StationService.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/controller/StationController.java`
- Create: `web-layer/src/main/java/ru/alabuga/dislocation/controller/AdminController.java`

- [ ] **Step 1: Создать `StationDto.java`**

```java
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
```

- [ ] **Step 2: Создать `StationService.java`**

```java
package ru.alabuga.dislocation.service;

import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.alabuga.dislocation.dto.StationDto;
import ru.alabuga.dislocation.model.RailwayStation;
import ru.alabuga.dislocation.repository.RailwayStationRepository;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StationService {

    private final RailwayStationRepository stationRepo;

    public List<StationDto> getAll() {
        return stationRepo.findAll().stream()
                .map(s -> StationDto.builder()
                        .code(s.getCode())
                        .name(s.getName())
                        .lat(s.getLat())
                        .lng(s.getLng())
                        .build())
                .toList();
    }

    public StationDto getByCode(String code) {
        return stationRepo.findById(code)
                .map(s -> StationDto.builder()
                        .code(s.getCode()).name(s.getName())
                        .lat(s.getLat()).lng(s.getLng()).build())
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Station not found: " + code));
    }

    @Transactional
    public int syncFromCsv(MultipartFile file) throws Exception {
        int count = 0;
        try (CSVReader reader = new CSVReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String[] header = reader.readNext(); // пропускаем заголовок
            String[] line;
            while ((line = reader.readNext()) != null) {
                if (line.length < 4) continue;
                RailwayStation station = RailwayStation.builder()
                        .code(line[0].trim())
                        .name(line[1].trim())
                        .lat(new BigDecimal(line[2].trim()))
                        .lng(new BigDecimal(line[3].trim()))
                        .build();
                stationRepo.save(station);
                count++;
            }
        }
        log.info("Synced {} stations", count);
        return count;
    }
}
```

CSV формат ожидается: `code,name,lat,lng` (заголовок в первой строке).

- [ ] **Step 3: Создать `StationController.java`**

```java
package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.StationDto;
import ru.alabuga.dislocation.service.StationService;

import java.util.List;

@Tag(name = "stations")
@RestController
@RequestMapping("/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @Operation(summary = "Справочник станций")
    @GetMapping
    public List<StationDto> getAll() {
        return stationService.getAll();
    }

    @Operation(summary = "Станция по коду РЖД")
    @GetMapping("/{code}")
    public StationDto getByCode(@PathVariable String code) {
        return stationService.getByCode(code);
    }
}
```

- [ ] **Step 4: Создать `AdminController.java`**

```java
package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.alabuga.dislocation.repository.DislocationEventRepository;
import ru.alabuga.dislocation.repository.WagonRepository;
import ru.alabuga.dislocation.repository.WagonTripRepository;
import ru.alabuga.dislocation.service.StationService;

import java.util.Map;

@Tag(name = "admin")
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final StationService stationService;
    private final WagonRepository wagonRepo;
    private final WagonTripRepository tripRepo;
    private final DislocationEventRepository eventRepo;

    @Operation(summary = "Загрузить справочник станций из CSV (формат: code,name,lat,lng)")
    @PostMapping(value = "/sync-stations", consumes = "multipart/form-data")
    public Map<String, Object> syncStations(@RequestParam("file") MultipartFile file) throws Exception {
        int count = stationService.syncFromCsv(file);
        return Map.of("imported", count);
    }

    @Operation(summary = "Статистика системы")
    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return Map.of(
                "wagons", wagonRepo.count(),
                "activeTrips", tripRepo.count(),
                "events", eventRepo.count()
        );
    }
}
```

- [ ] **Step 5: Собрать весь backend**

```bash
cd mvps/railway-dislocation-java
./gradlew :web-layer:build
```

Ожидаем: `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit**

```bash
git add mvps/railway-dislocation-java/web-layer/
git commit -m "feat: add station and admin API"
```

---

## Task 13: Frontend — React + TypeScript + MUI + роутинг

**Files:**
- Create: `mvps/railway-dislocation-java/frontend/` (весь проект через Vite)

- [ ] **Step 1: Создать React приложение через Vite**

```bash
cd mvps/railway-dislocation-java
npm create vite@latest frontend -- --template react-ts
cd frontend
```

- [ ] **Step 2: Установить зависимости**

```bash
npm install \
  @mui/material@6.4.5 \
  @mui/icons-material@6.4.5 \
  @mui/x-data-grid@7.27.1 \
  @emotion/react \
  @emotion/styled \
  react-router-dom@6 \
  @tanstack/react-query@5 \
  axios \
  react-leaflet@4 \
  leaflet \
  @types/leaflet
```

- [ ] **Step 3: Создать `src/api/client.ts`** — axios с базовым URL

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

- [ ] **Step 4: Создать `src/theme.ts`** — MUI тема в стиле ALIS (Inter шрифт, тёмно-синий primary)

```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary:   { main: '#1a3c6e' },
    secondary: { main: '#e8f0fe' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontSize: 13,
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: { border: 'none', fontSize: 13 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 6 },
      },
    },
  },
});
```

- [ ] **Step 5: Создать `src/main.tsx`**

```tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { theme } from './theme';
import 'leaflet/dist/leaflet.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
```

- [ ] **Step 6: Создать `src/App.tsx`** — роутинг

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MapPage from './pages/MapPage';
import WagonsPage from './pages/WagonsPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/map" replace />} />
        <Route path="map"      element={<MapPage />} />
        <Route path="wagons"   element={<WagonsPage />} />
        <Route path="trips"    element={<TripsPage />} />
        <Route path="trips/:id" element={<TripDetailPage />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 7: Создать `src/components/Layout.tsx`** — Header + Sidebar + Content как в ALIS

```tsx
import { Box, AppBar, Toolbar, Typography, Drawer, List,
         ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import TrainIcon from '@mui/icons-material/Train';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const SIDEBAR_WIDTH = 220;

const NAV_ITEMS = [
  { label: 'Карта',   path: '/map',    icon: <MapIcon /> },
  { label: 'Вагоны',  path: '/wagons', icon: <TrainIcon /> },
  { label: 'Рейсы',   path: '/trips',  icon: <DirectionsRailwayIcon /> },
];

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: 1300, bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={600}>
            Дислокация вагонов
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent"
        sx={{ width: SIDEBAR_WIDTH,
              '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, mt: '64px' } }}>
        <List>
          {NAV_ITEMS.map(item => (
            <ListItemButton key={item.path}
              selected={pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main"
        sx={{ flexGrow: 1, mt: '64px', ml: `${SIDEBAR_WIDTH}px`, p: 2, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 8: Проверить что фронтенд запускается**

```bash
cd mvps/railway-dislocation-java/frontend
npm run dev
```

Открыть `http://localhost:5173` — должны видеть Layout с сайдбаром.

- [ ] **Step 9: Commit**

```bash
git add mvps/railway-dislocation-java/frontend/
git commit -m "feat: setup React TypeScript frontend with MUI theme and routing"
```

---

## Task 14: Map Page — Leaflet карта вагонов

**Files:**
- Create: `frontend/src/pages/MapPage.tsx`
- Create: `frontend/src/api/wagons.ts`

- [ ] **Step 1: Создать `src/api/wagons.ts`** — API клиент для вагонов

```typescript
import apiClient from './client';

export interface WagonMapDto {
  id: string;
  wagonNumber: string;
  lat: number;
  lng: number;
  remainingDistance: number | null;
  operationCode: string | null;
  trainNumber: string | null;
  destinationStationCode: string | null;
}

export interface WagonDto {
  id: string;
  wagonNumber: string;
  stationCode: string | null;
  stationName: string | null;
  currentTrainNumber: string | null;
  remainingDistance: number | null;
  operationCode: string | null;
  operationName: string | null;
  lastSeenAt: string | null;
  destinationStationCode: string | null;
  containerNumbers: string[] | null;
  cargoWeight: number | null;
  dateArrivalAtDestination: string | null;
  activeTripId: string | null;
}

export const wagonsApi = {
  getForMap: () =>
    apiClient.get<WagonMapDto[]>('/wagons/map').then(r => r.data),

  getPage: (params: { filter?: object; page?: number; size?: number }) =>
    apiClient.post<{ content: WagonDto[]; totalElements: number }>('/wagons/page', params).then(r => r.data),

  getById: (id: string) =>
    apiClient.get<WagonDto>(`/wagons/${id}`).then(r => r.data),
};
```

- [ ] **Step 2: Создать `src/pages/MapPage.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { wagonsApi, WagonMapDto } from '../api/wagons';

const OUR_STATION = '648400';

function getMarkerColor(wagon: WagonMapDto): string {
  if (wagon.operationCode === '96' && wagon.stationCode === OUR_STATION) return '#f44336'; // красный — на нашей станции
  if (wagon.destinationStationCode === OUR_STATION) return '#4caf50'; // зелёный — едет к нам
  return '#2196f3'; // синий — едет от нас
}

export default function MapPage() {
  const { data: wagons = [], isLoading } = useQuery({
    queryKey: ['wagons-map'],
    queryFn: wagonsApi.getForMap,
    refetchInterval: 60_000,   // обновляем каждые 60 сек
  });

  if (isLoading) {
    return <Box p={3}><Typography>Загрузка карты...</Typography></Box>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography variant="subtitle2">Вагонов на карте: {wagons.length}</Typography>
        <Chip size="small" label="Едет к нам" sx={{ bgcolor: '#4caf50', color: '#fff' }} />
        <Chip size="small" label="Едет от нас" sx={{ bgcolor: '#2196f3', color: '#fff' }} />
        <Chip size="small" label="На станции 648400" sx={{ bgcolor: '#f44336', color: '#fff' }} />
      </Box>

      <Box sx={{ flex: 1, borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer
          center={[56.0, 54.0]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {wagons.map(wagon => (
            <CircleMarker
              key={wagon.id}
              center={[wagon.lat, wagon.lng]}
              radius={8}
              pathOptions={{ fillColor: getMarkerColor(wagon), color: '#fff', weight: 1, fillOpacity: 0.9 }}>
              <Popup>
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Вагон {wagon.wagonNumber}
                  </Typography>
                  {wagon.trainNumber && (
                    <Typography variant="body2">Поезд: {wagon.trainNumber}</Typography>
                  )}
                  {wagon.remainingDistance != null && (
                    <Typography variant="body2">До пункта: {wagon.remainingDistance} км</Typography>
                  )}
                  {wagon.destinationStationCode && (
                    <Typography variant="body2">Назначение: {wagon.destinationStationCode}</Typography>
                  )}
                </Box>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 3: Исправить конфликт иконок Leaflet с Vite** — добавить в `src/main.tsx` перед импортом leaflet css:

```typescript
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
```

- [ ] **Step 4: Проверить карту в браузере**

```bash
npm run dev
```

Открыть `http://localhost:5173/map` — должна рендериться карта OpenStreetMap.

- [ ] **Step 5: Commit**

```bash
git add mvps/railway-dislocation-java/frontend/
git commit -m "feat: add Leaflet map page with wagon markers"
```

---

## Task 15: Wagons + Trips страницы

**Files:**
- Create: `frontend/src/pages/WagonsPage.tsx`
- Create: `frontend/src/pages/TripsPage.tsx`
- Create: `frontend/src/pages/TripDetailPage.tsx`
- Create: `frontend/src/api/trips.ts`

- [ ] **Step 1: Создать `src/api/trips.ts`**

```typescript
import apiClient from './client';
import { TripStatus } from './types';

export interface TripDto {
  id: string;
  wagonNumber: string | null;
  depStationCode: string | null;
  depStationName: string | null;
  dstStationCode: string | null;
  dstStationName: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: TripStatus;
}

export interface TripEventDto {
  id: string;
  stationCode: string | null;
  operationCode: string | null;
  operationName: string | null;
  operationDatetime: string | null;
  remainingDistance: number | null;
  trainNumber: string | null;
  containerNumbers: string[] | null;
}

export const tripsApi = {
  getPage: (params: { filter?: object; page?: number; size?: number }) =>
    apiClient.post<{ content: TripDto[]; totalElements: number }>('/trips/page', params).then(r => r.data),

  getById: (id: string) =>
    apiClient.get<TripDto>(`/trips/${id}`).then(r => r.data),

  getEvents: (id: string) =>
    apiClient.get<TripEventDto[]>(`/trips/${id}/events`).then(r => r.data),
};
```

- [ ] **Step 2: Создать `src/api/types.ts`**

```typescript
export type TripStatus = 'ACTIVE' | 'COMPLETED';
```

- [ ] **Step 3: Создать `src/pages/WagonsPage.tsx`**

```tsx
import { useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { wagonsApi, WagonDto } from '../api/wagons';

const COLUMNS: GridColDef<WagonDto>[] = [
  { field: 'wagonNumber',    headerName: 'Вагон',     width: 120 },
  { field: 'stationName',    headerName: 'Станция',   flex: 1 },
  { field: 'currentTrainNumber', headerName: 'Поезд', width: 100 },
  { field: 'remainingDistance',  headerName: 'Км до пункта', width: 130,
    valueFormatter: (v) => v != null ? `${v} км` : '—' },
  { field: 'operationName',  headerName: 'Операция',  flex: 1 },
  { field: 'lastSeenAt',     headerName: 'Обновлён',  width: 170,
    valueFormatter: (v) => v ? new Date(v).toLocaleString('ru') : '—' },
];

export default function WagonsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['wagons', page, search],
    queryFn: () => wagonsApi.getPage({
      filter: search ? { wagonNumber: search } : undefined,
      page,
      size: pageSize,
    }),
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6">Вагоны</Typography>
        <TextField size="small" placeholder="Поиск по номеру вагона"
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 260 }} />
      </Box>

      <DataGrid
        rows={data?.content ?? []}
        columns={COLUMNS}
        rowCount={data?.totalElements ?? 0}
        loading={isLoading}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={m => setPage(m.page)}
        pageSizeOptions={[50]}
        disableRowSelectionOnClick
        sx={{ flex: 1 }}
      />
    </Box>
  );
}
```

- [ ] **Step 4: Создать `src/pages/TripsPage.tsx`**

```tsx
import { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tripsApi, TripDto } from '../api/trips';

const COLUMNS: GridColDef<TripDto>[] = [
  { field: 'wagonNumber',    headerName: 'Вагон',     width: 120 },
  { field: 'depStationName', headerName: 'Откуда',    flex: 1 },
  { field: 'dstStationName', headerName: 'Куда',      flex: 1 },
  { field: 'startedAt',      headerName: 'Начат',     width: 170,
    valueFormatter: (v) => v ? new Date(v).toLocaleString('ru') : '—' },
  { field: 'status',         headerName: 'Статус',    width: 130,
    renderCell: ({ value }) => (
      <Chip size="small"
        label={value === 'ACTIVE' ? 'Активен' : 'Завершён'}
        color={value === 'ACTIVE' ? 'success' : 'default'} />
    )},
];

export default function TripsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['trips', page],
    queryFn: () => tripsApi.getPage({ page, size: pageSize }),
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Рейсы</Typography>

      <DataGrid
        rows={data?.content ?? []}
        columns={COLUMNS}
        rowCount={data?.totalElements ?? 0}
        loading={isLoading}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={m => setPage(m.page)}
        pageSizeOptions={[50]}
        onRowClick={({ id }) => navigate(`/trips/${id}`)}
        sx={{ flex: 1, cursor: 'pointer' }}
      />
    </Box>
  );
}
```

- [ ] **Step 5: Создать `src/pages/TripDetailPage.tsx`** — карточка рейса + хронология

```tsx
import { Box, Typography, Chip, Divider, Paper, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { tripsApi, TripEventDto } from '../api/trips';

function EventRow({ event }: { event: TripEventDto }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
        {event.operationDatetime
          ? new Date(event.operationDatetime).toLocaleString('ru')
          : '—'}
      </Typography>
      <Box>
        <Typography variant="body2" fontWeight={500}>{event.operationName}</Typography>
        <Typography variant="caption" color="text.secondary">
          {event.stationCode} · {event.trainNumber && `Поезд ${event.trainNumber}`}
          {event.remainingDistance != null && ` · ${event.remainingDistance} км`}
        </Typography>
        {event.containerNumbers?.length ? (
          <Typography variant="caption" display="block">
            Контейнеры: {event.containerNumbers.join(', ')}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: trip } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripsApi.getById(id!),
    enabled: !!id,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['trip-events', id],
    queryFn: () => tripsApi.getEvents(id!),
    enabled: !!id,
  });

  if (!trip) return null;

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, cursor: 'pointer' }}
        onClick={() => navigate(-1)}>
        <ArrowBackIcon fontSize="small" />
        <Typography variant="body2">Назад к рейсам</Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Вагон {trip.wagonNumber}</Typography>
          <Chip size="small"
            label={trip.status === 'ACTIVE' ? 'Активен' : 'Завершён'}
            color={trip.status === 'ACTIVE' ? 'success' : 'default'} />
        </Stack>
        <Typography variant="body2">
          {trip.depStationName ?? trip.depStationCode} → {trip.dstStationName ?? trip.dstStationCode}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Начат: {trip.startedAt ? new Date(trip.startedAt).toLocaleString('ru') : '—'}
          {trip.finishedAt && ` · Завершён: ${new Date(trip.finishedAt).toLocaleString('ru')}`}
        </Typography>
      </Paper>

      <Typography variant="subtitle2" gutterBottom>
        История операций ({events.length})
      </Typography>
      <Paper sx={{ p: 2 }}>
        {events.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Нет данных</Typography>
        ) : (
          events.map((event, i) => (
            <Box key={event.id}>
              <EventRow event={event} />
              {i < events.length - 1 && <Divider />}
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}
```

- [ ] **Step 6: Проверить все страницы**

```bash
npm run dev
```

Открыть `/wagons`, `/trips`, `/trips/some-id` — должны рендериться без ошибок.

- [ ] **Step 7: Commit**

```bash
git add mvps/railway-dislocation-java/frontend/
git commit -m "feat: add wagons table, trips table, and trip detail pages"
```

---

## Task 16: Docker Compose

**Files:**
- Create: `mvps/railway-dislocation-java/Dockerfile.backend`
- Create: `mvps/railway-dislocation-java/frontend/Dockerfile`
- Create: `mvps/railway-dislocation-java/docker-compose.yml`
- Create: `mvps/railway-dislocation-java/.env.example`

- [ ] **Step 1: Создать `Dockerfile.backend`**

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY web-layer/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 2: Создать `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
```

- [ ] **Step 3: Создать `frontend/nginx.conf`**

```nginx
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- [ ] **Step 4: Создать `docker-compose.yml`**

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      KEYCLOAK_ISSUER_URI: ${KEYCLOAK_ISSUER_URI:-http://localhost:8080/realms/KIS}
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
```

- [ ] **Step 5: Создать `.env.example`**

```env
DATABASE_URL=jdbc:postgresql://host:5432/alis
DATABASE_USERNAME=alis
DATABASE_PASSWORD=secret
KEYCLOAK_ISSUER_URI=https://keycloak.alabuga.ru/realms/KIS
```

- [ ] **Step 6: Собрать backend JAR**

```bash
cd mvps/railway-dislocation-java
./gradlew :web-layer:bootJar
```

Ожидаем: `web-layer/build/libs/web-layer-1.0.0.jar`

- [ ] **Step 7: Собрать Docker образы**

```bash
docker compose build
```

Ожидаем: `BUILD SUCCESSFUL` для обоих образов.

- [ ] **Step 8: Final commit**

```bash
git add mvps/railway-dislocation-java/
git commit -m "feat: add Docker Compose for backend and frontend"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Webhook от РЖД → Task 8-9
- ✅ 4 таблицы БД → Task 2-3
- ✅ Keycloak OAuth2 → Task 6
- ✅ Liquibase миграции → Task 2
- ✅ QueryDSL фильтры → Task 5
- ✅ `/wagons/map` лёгкий эндпоинт → Task 10
- ✅ Leaflet карта → Task 14
- ✅ Таблица вагонов → Task 15
- ✅ Таблица рейсов + детальная карточка → Task 15
- ✅ История операций рейса → Task 11
- ✅ Station справочник + CSV импорт → Task 12
- ✅ Docker Compose → Task 16
- ✅ Тесты для ProcessingService (TDD) → Task 8

**Известные нюансы:**
- Circular FK (wagon ↔ wagon_trip) решён порядком создания таблиц в Liquibase (Task 2)
- JSONB с Hibernate 6: используем `@JdbcTypeCode(SqlTypes.JSON)` (Task 3)
- Leaflet + Vite: конфликт иконок решён через `L.Icon.Default.mergeOptions` (Task 14)
- Q-классы QueryDSL генерируются в `build/generated/` — добавлены в `srcDirs` (Task 1)
