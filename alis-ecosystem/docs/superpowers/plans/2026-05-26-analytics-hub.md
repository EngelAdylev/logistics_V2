# Analytics Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать MVP-дашборд в `mvps/analytics-hub/` для техподдержки — мониторинг пакетов Datareon и статусов заказов ALIS в реальном времени (polling каждые 10 сек), read-only из ALIS PostgreSQL.

**Architecture:** Spring Boot бэкенд читает из ALIS PostgreSQL (схема `alis`) таблицы `inbound_event`, `outbound_data`, `receiving_order`, `shipping_order`, `client` через JPA. Четыре REST-эндпоинта отдают данные фронтенду. React-фронт с MUI polling'ует их каждые 10 секунд.

**Tech Stack:** Java 17, Spring Boot 3.3.0, Spring Data JPA, PostgreSQL, Lombok | React 18, TypeScript, MUI v6, Vite, Axios

**Design spec:** `docs/superpowers/specs/2026-05-26-analytics-hub-design.md`

---

## Структура файлов (до начала кодирования)

```
mvps/analytics-hub/
├── build.gradle
├── settings.gradle
├── src/
│   ├── main/
│   │   ├── java/ru/alabuga/analytics/
│   │   │   ├── AnalyticsApplication.java
│   │   │   ├── config/
│   │   │   │   └── SecurityConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── DatareonController.java
│   │   │   │   └── OrderController.java
│   │   │   ├── dto/
│   │   │   │   ├── datareon/
│   │   │   │   │   ├── EventDto.java
│   │   │   │   │   ├── EventFilterRequest.java
│   │   │   │   │   └── SummaryDto.java
│   │   │   │   └── orders/
│   │   │   │       ├── OrderSummaryDto.java
│   │   │   │       ├── OrderFilterRequest.java
│   │   │   │       └── StuckOrderDto.java
│   │   │   ├── model/
│   │   │   │   ├── Client.java
│   │   │   │   ├── InboundEvent.java
│   │   │   │   ├── OutboundData.java
│   │   │   │   ├── ReceivingOrder.java
│   │   │   │   └── ShippingOrder.java
│   │   │   ├── repository/
│   │   │   │   ├── ClientRepository.java
│   │   │   │   ├── InboundEventRepository.java
│   │   │   │   ├── OutboundDataRepository.java
│   │   │   │   ├── ReceivingOrderRepository.java
│   │   │   │   └── ShippingOrderRepository.java
│   │   │   ├── service/
│   │   │   │   ├── DatareonService.java
│   │   │   │   └── OrderService.java
│   │   │   └── util/
│   │   │       └── SystemMapper.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/java/ru/alabuga/analytics/
│       ├── service/
│       │   ├── DatareonServiceTest.java
│       │   └── OrderServiceTest.java
│       └── util/
│           └── SystemMapperTest.java
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── datareon.ts
    │   │   └── orders.ts
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   └── StatCard.tsx
    │   ├── hooks/
    │   │   └── usePolling.ts
    │   ├── pages/
    │   │   ├── DatareonPage.tsx
    │   │   └── OrdersPage.tsx
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Важные факты о схеме БД (прочитай перед началом)

### `alis.inbound_event` — входящие пакеты от Datareon

```sql
id uuid, task_id uuid, order_id uuid, order_number varchar(9),
terminal_area varchar(100), event_code varchar(20), event_name varchar(50),
event_date_time timestamp, status varchar(9), status_details varchar(1000),
action_codes varchar(21)[], created_at timestamp, created_by varchar(50),
updated_at timestamp, updated_by varchar(50)
```

Примеры status: `DONE`. Примеры event_code: `UNLOAD_FINISH`, `DOCK_ASG`, `LOAD_FINISH`, `LOAD_START`.

"Завис" = status != 'DONE' AND created_at < NOW() - 15 минут.

### `alis.outbound_data` — исходящие пакеты в Datareon

```sql
id uuid, root_object_id uuid, message_type varchar(255), created_at timestamp,
updated_at timestamp, success boolean (nullable), entity_type varchar(100),
message_id uuid, response_code integer, error_message text,
created_by varchar(50), attempts smallint, last_attempt_at timestamp
```

Примеры message_type: `CARGO_RECEIVING_TASK`, `RECEIVING_TRANSPORT_MANIFEST`, `CARGO_SHIPMENT_TASK`, `CONTRACTOR`.

success: `true` = успех, `false` = ошибка, `null` = ещё не ответили.

"Завис" = success IS NULL AND created_at < NOW() - 15 минут.

### `alis.receiving_order` и `alis.shipping_order`

Оба имеют: `id uuid, number integer, order_status varchar(100), client_id uuid, terminal_area varchar(100), transport_type varchar(100), created_at timestamp, updated_at timestamp`.

"Завис" заказ = order_status = 'IN_PROGRESS' AND updated_at < NOW() - 4 часа.

### `alis.client`

```sql
id uuid, code varchar(100), name varchar(255), active boolean, sync_id uuid, inn varchar(12)
```

---

## Task 1: Bootstrap backend проект

**Files:**
- Create: `mvps/analytics-hub/settings.gradle`
- Create: `mvps/analytics-hub/build.gradle`
- Create: `mvps/analytics-hub/src/main/java/ru/alabuga/analytics/AnalyticsApplication.java`
- Create: `mvps/analytics-hub/src/main/resources/application.yml`

- [ ] **Step 1: Создать директории**

```bash
mkdir -p mvps/analytics-hub/src/main/java/ru/alabuga/analytics
mkdir -p mvps/analytics-hub/src/main/resources
mkdir -p mvps/analytics-hub/src/test/java/ru/alabuga/analytics
```

- [ ] **Step 2: Создать `settings.gradle`**

```groovy
rootProject.name = 'analytics-hub'
```

- [ ] **Step 3: Создать `build.gradle`**

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.3.0'
    id 'io.spring.dependency-management' version '1.1.5'
}

group = 'ru.alabuga'
version = '1.0.0'
java.sourceCompatibility = JavaVersion.VERSION_17

repositories {
    mavenCentral()
}

configurations {
    compileOnly { extendsFrom annotationProcessor }
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    runtimeOnly 'org.postgresql:postgresql'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

test {
    useJUnitPlatform()
}
```

- [ ] **Step 4: Создать `application.yml`**

```yaml
spring:
  application:
    name: analytics-hub
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/alis}
    username: ${DATABASE_USERNAME:alis_prod}
    password: ${DATABASE_PASSWORD:}
  jpa:
    hibernate:
      ddl-auto: none
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        default_schema: alis
    open-in-view: false

server:
  port: ${SERVER_PORT:8091}
  servlet:
    context-path: /api

springdoc:
  swagger-ui:
    path: /swagger-ui.html
```

- [ ] **Step 5: Создать `AnalyticsApplication.java`**

```java
package ru.alabuga.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AnalyticsApplication {
    public static void main(String[] args) {
        SpringApplication.run(AnalyticsApplication.class, args);
    }
}
```

- [ ] **Step 6: Проверить что проект компилируется**

```bash
cd mvps/analytics-hub && ./gradlew compileJava
```

Если `gradlew` нет — скопируй из `mvps/railway-dislocation-java/`:
```bash
cp mvps/railway-dislocation-java/gradlew mvps/analytics-hub/
cp mvps/railway-dislocation-java/gradlew.bat mvps/analytics-hub/
cp -r mvps/railway-dislocation-java/gradle mvps/analytics-hub/
```

Ожидаемый результат: `BUILD SUCCESSFUL`

- [ ] **Step 7: Commit**

```bash
git add mvps/analytics-hub/
git commit -m "feat(analytics-hub): bootstrap Spring Boot project"
```

---

## Task 2: JPA-модели (read-only)

**Files:**
- Create: `src/main/java/ru/alabuga/analytics/model/InboundEvent.java`
- Create: `src/main/java/ru/alabuga/analytics/model/OutboundData.java`
- Create: `src/main/java/ru/alabuga/analytics/model/ReceivingOrder.java`
- Create: `src/main/java/ru/alabuga/analytics/model/ShippingOrder.java`
- Create: `src/main/java/ru/alabuga/analytics/model/Client.java`

Все модели — `@Immutable` (Hibernate), только чтение. Путь `src/` ниже — это `mvps/analytics-hub/src/`.

- [ ] **Step 1: Создать `InboundEvent.java`**

```java
package ru.alabuga.analytics.model;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Immutable
@Table(name = "inbound_event")
@Getter
public class InboundEvent {

    @Id
    private UUID id;

    private UUID taskId;
    private UUID orderId;
    private String orderNumber;
    private String terminalArea;
    private String eventCode;
    private String eventName;
    private LocalDateTime eventDateTime;
    private String status;
    private String statusDetails;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 2: Создать `OutboundData.java`**

```java
package ru.alabuga.analytics.model;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Immutable
@Table(name = "outbound_data")
@Getter
public class OutboundData {

    @Id
    private UUID id;

    private UUID rootObjectId;
    private String messageType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean success;
    private String entityType;
    private UUID messageId;
    private Integer responseCode;
    private String errorMessage;
    private String createdBy;
    private Short attempts;
    private LocalDateTime lastAttemptAt;
}
```

- [ ] **Step 3: Создать `ReceivingOrder.java`**

```java
package ru.alabuga.analytics.model;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Immutable
@Table(name = "receiving_order")
@Getter
public class ReceivingOrder {

    @Id
    private UUID id;

    private Integer number;
    private String orderStatus;
    private UUID clientId;
    private String terminalArea;
    private String transportType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime planReceivingDateTime;
    private LocalDateTime actualReceivingDateTime;
}
```

- [ ] **Step 4: Создать `ShippingOrder.java`**

```java
package ru.alabuga.analytics.model;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Immutable
@Table(name = "shipping_order")
@Getter
public class ShippingOrder {

    @Id
    private UUID id;

    private Integer number;
    private String orderStatus;
    private UUID clientId;
    private String terminalArea;
    private String transportType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime plannedShippingDateTime;
    private LocalDateTime actualShippingDateTime;
}
```

- [ ] **Step 5: Создать `Client.java`**

```java
package ru.alabuga.analytics.model;

import jakarta.persistence.*;
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
```

- [ ] **Step 6: Проверить компиляцию**

```bash
cd mvps/analytics-hub && ./gradlew compileJava
```

Ожидаемый результат: `BUILD SUCCESSFUL`

- [ ] **Step 7: Commit**

```bash
git add mvps/analytics-hub/src/main/java/ru/alabuga/analytics/model/
git commit -m "feat(analytics-hub): add read-only JPA entities"
```

---

## Task 3: Репозитории

**Files:**
- Create: `src/main/java/ru/alabuga/analytics/repository/InboundEventRepository.java`
- Create: `src/main/java/ru/alabuga/analytics/repository/OutboundDataRepository.java`
- Create: `src/main/java/ru/alabuga/analytics/repository/ReceivingOrderRepository.java`
- Create: `src/main/java/ru/alabuga/analytics/repository/ShippingOrderRepository.java`
- Create: `src/main/java/ru/alabuga/analytics/repository/ClientRepository.java`

- [ ] **Step 1: Создать `InboundEventRepository.java`**

```java
package ru.alabuga.analytics.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.alabuga.analytics.model.InboundEvent;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface InboundEventRepository extends JpaRepository<InboundEvent, UUID> {

    long countByCreatedAtAfter(LocalDateTime since);

    long countByStatusAndCreatedAtAfter(String status, LocalDateTime since);

    @Query("SELECT COUNT(e) FROM InboundEvent e WHERE e.status <> 'DONE' AND e.createdAt < :threshold")
    long countStuck(LocalDateTime threshold);

    @Query("SELECT COUNT(e) FROM InboundEvent e WHERE e.createdAt > :since AND e.status <> 'DONE' AND e.status <> 'ERROR'")
    long countInProgress(LocalDateTime since);

    Page<InboundEvent> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since, Pageable pageable);

    @Query("SELECT e FROM InboundEvent e WHERE e.createdAt > :since AND e.status = 'ERROR' ORDER BY e.createdAt DESC")
    Page<InboundEvent> findErrors(LocalDateTime since, Pageable pageable);

    @Query("SELECT e FROM InboundEvent e WHERE e.status <> 'DONE' AND e.createdAt < :threshold ORDER BY e.createdAt DESC")
    Page<InboundEvent> findStuck(LocalDateTime threshold, Pageable pageable);
}
```

- [ ] **Step 2: Создать `OutboundDataRepository.java`**

```java
package ru.alabuga.analytics.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.alabuga.analytics.model.OutboundData;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface OutboundDataRepository extends JpaRepository<OutboundData, UUID> {

    long countByCreatedAtAfter(LocalDateTime since);

    long countBySuccessTrueAndCreatedAtAfter(LocalDateTime since);

    long countBySuccessFalseAndCreatedAtAfter(LocalDateTime since);

    @Query("SELECT COUNT(d) FROM OutboundData d WHERE d.success IS NULL AND d.createdAt < :threshold")
    long countStuck(LocalDateTime threshold);

    Page<OutboundData> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since, Pageable pageable);

    @Query("SELECT d FROM OutboundData d WHERE d.createdAt > :since AND d.success = false ORDER BY d.createdAt DESC")
    Page<OutboundData> findErrors(LocalDateTime since, Pageable pageable);

    @Query("SELECT d FROM OutboundData d WHERE d.success IS NULL AND d.createdAt < :threshold ORDER BY d.createdAt DESC")
    Page<OutboundData> findStuck(LocalDateTime threshold, Pageable pageable);
}
```

- [ ] **Step 3: Создать `ReceivingOrderRepository.java`**

```java
package ru.alabuga.analytics.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.alabuga.analytics.model.ReceivingOrder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ReceivingOrderRepository extends JpaRepository<ReceivingOrder, UUID> {

    long countByOrderStatus(String orderStatus);

    @Query("SELECT o FROM ReceivingOrder o WHERE o.orderStatus = 'IN_PROGRESS' AND o.updatedAt < :threshold ORDER BY o.updatedAt ASC")
    List<ReceivingOrder> findStuck(LocalDateTime threshold);

    List<ReceivingOrder> findByClientIdIn(List<UUID> clientIds);
}
```

- [ ] **Step 4: Создать `ShippingOrderRepository.java`**

```java
package ru.alabuga.analytics.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.alabuga.analytics.model.ShippingOrder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ShippingOrderRepository extends JpaRepository<ShippingOrder, UUID> {

    long countByOrderStatus(String orderStatus);

    @Query("SELECT o FROM ShippingOrder o WHERE o.orderStatus = 'IN_PROGRESS' AND o.updatedAt < :threshold ORDER BY o.updatedAt ASC")
    List<ShippingOrder> findStuck(LocalDateTime threshold);
}
```

- [ ] **Step 5: Создать `ClientRepository.java`**

```java
package ru.alabuga.analytics.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.alabuga.analytics.model.Client;

import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {
}
```

- [ ] **Step 6: Commit**

```bash
git add mvps/analytics-hub/src/main/java/ru/alabuga/analytics/repository/
git commit -m "feat(analytics-hub): add repositories for ALIS read-only access"
```

---

## Task 4: SystemMapper утилита (TDD)

**Files:**
- Create: `src/main/java/ru/alabuga/analytics/util/SystemMapper.java`
- Create: `src/test/java/ru/alabuga/analytics/util/SystemMapperTest.java`

SystemMapper определяет систему-источник/назначение для пакетов Datareon.

Логика для `outbound_data.message_type`:
- `CARGO_RECEIVING_TASK`, `CARGO_SHIPMENT_TASK` → `WMS`
- `RECEIVING_TRANSPORT_MANIFEST`, `SHIPMENT_TRANSPORT_MANIFEST` → `TOS`
- `CONTRACTOR`, `CLIENT_*` → `1C`
- Остальные → `DATAREON`

Логика для `inbound_event.event_code`:
- Начинается с `LOAD_`, `UNLOAD_`, `DOCK_` → `TOS`
- Начинается с `STATUS_` → `WMS`
- Остальные → `WMS`

- [ ] **Step 1: Написать тест (запустить — должен FAIL)**

```java
package ru.alabuga.analytics.util;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class SystemMapperTest {

    @Test
    void outbound_cargo_task_maps_to_wms() {
        assertThat(SystemMapper.fromMessageType("CARGO_RECEIVING_TASK")).isEqualTo("WMS");
        assertThat(SystemMapper.fromMessageType("CARGO_SHIPMENT_TASK")).isEqualTo("WMS");
    }

    @Test
    void outbound_manifest_maps_to_tos() {
        assertThat(SystemMapper.fromMessageType("RECEIVING_TRANSPORT_MANIFEST")).isEqualTo("TOS");
        assertThat(SystemMapper.fromMessageType("SHIPMENT_TRANSPORT_MANIFEST")).isEqualTo("TOS");
    }

    @Test
    void outbound_contractor_maps_to_1c() {
        assertThat(SystemMapper.fromMessageType("CONTRACTOR")).isEqualTo("1C");
    }

    @Test
    void outbound_unknown_maps_to_datareon() {
        assertThat(SystemMapper.fromMessageType("UNKNOWN_TYPE")).isEqualTo("DATAREON");
    }

    @Test
    void inbound_load_events_map_to_tos() {
        assertThat(SystemMapper.fromEventCode("LOAD_FINISH")).isEqualTo("TOS");
        assertThat(SystemMapper.fromEventCode("UNLOAD_FINISH")).isEqualTo("TOS");
        assertThat(SystemMapper.fromEventCode("DOCK_ASG")).isEqualTo("TOS");
    }

    @Test
    void inbound_status_events_map_to_wms() {
        assertThat(SystemMapper.fromEventCode("STATUS_IN_WORK")).isEqualTo("WMS");
    }
}
```

- [ ] **Step 2: Запустить тест — убедиться что FAIL**

```bash
cd mvps/analytics-hub && ./gradlew test --tests "ru.alabuga.analytics.util.SystemMapperTest"
```

Ожидаемый результат: `FAILED` (класс не существует)

- [ ] **Step 3: Создать `SystemMapper.java`**

```java
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
```

- [ ] **Step 4: Запустить тест — убедиться что PASS**

```bash
cd mvps/analytics-hub && ./gradlew test --tests "ru.alabuga.analytics.util.SystemMapperTest"
```

Ожидаемый результат: `BUILD SUCCESSFUL`, все тесты зелёные.

- [ ] **Step 5: Commit**

```bash
git add mvps/analytics-hub/src/
git commit -m "feat(analytics-hub): add SystemMapper with tests"
```

---

## Task 5: Datareon DTOs, Service, Controller (TDD)

**Files:**
- Create: `src/main/java/ru/alabuga/analytics/dto/datareon/SummaryDto.java`
- Create: `src/main/java/ru/alabuga/analytics/dto/datareon/EventDto.java`
- Create: `src/main/java/ru/alabuga/analytics/dto/datareon/EventFilterRequest.java`
- Create: `src/main/java/ru/alabuga/analytics/service/DatareonService.java`
- Create: `src/main/java/ru/alabuga/analytics/controller/DatareonController.java`
- Create: `src/test/java/ru/alabuga/analytics/service/DatareonServiceTest.java`

- [ ] **Step 1: Создать DTO-классы**

`SummaryDto.java`:
```java
package ru.alabuga.analytics.dto.datareon;

public record SummaryDto(long total, long success, long errors, long stuck) {}
```

`EventDto.java`:
```java
package ru.alabuga.analytics.dto.datareon;

import java.time.LocalDateTime;

public record EventDto(
    String id,
    LocalDateTime time,
    String direction,   // "INBOUND" | "OUTBOUND"
    String system,      // "WMS" | "TOS" | "1C" | "DATAREON" | "ETRAN"
    String eventType,
    String status,      // "Успешно" | "Ошибка" | "В обработке" | "Завис"
    String error
) {}
```

`EventFilterRequest.java`:
```java
package ru.alabuga.analytics.dto.datareon;

public record EventFilterRequest(
    String period,    // "1h" | "6h" | "24h", default "1h"
    String status,    // "ALL" | "ERROR" | "STUCK", default "ALL"
    String system,    // "ALL" | "WMS" | "TOS" | "1C" | "DATAREON", default "ALL"
    int page,
    int size
) {
    public EventFilterRequest {
        if (period == null) period = "1h";
        if (status == null) status = "ALL";
        if (system == null) system = "ALL";
        if (size <= 0 || size > 100) size = 50;
    }
}
```

- [ ] **Step 2: Написать тест для DatareonService**

```java
package ru.alabuga.analytics.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.alabuga.analytics.dto.datareon.SummaryDto;
import ru.alabuga.analytics.repository.InboundEventRepository;
import ru.alabuga.analytics.repository.OutboundDataRepository;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatareonServiceTest {

    @Mock
    InboundEventRepository inboundEventRepository;

    @Mock
    OutboundDataRepository outboundDataRepository;

    @InjectMocks
    DatareonService datareonService;

    @Test
    void summary_combines_inbound_and_outbound_counts() {
        when(inboundEventRepository.countByCreatedAtAfter(any())).thenReturn(10L);
        when(inboundEventRepository.countByStatusAndCreatedAtAfter(any(), any())).thenReturn(8L);
        when(inboundEventRepository.countStuck(any())).thenReturn(1L);

        when(outboundDataRepository.countByCreatedAtAfter(any())).thenReturn(20L);
        when(outboundDataRepository.countBySuccessTrueAndCreatedAtAfter(any())).thenReturn(18L);
        when(outboundDataRepository.countBySuccessFalseAndCreatedAtAfter(any())).thenReturn(1L);
        when(outboundDataRepository.countStuck(any())).thenReturn(1L);

        SummaryDto result = datareonService.getSummary("1h");

        assertThat(result.total()).isEqualTo(30L);
        assertThat(result.success()).isEqualTo(26L);
        assertThat(result.errors()).isEqualTo(1L); // only outbound errors counted explicitly
        assertThat(result.stuck()).isEqualTo(2L);
    }
}
```

- [ ] **Step 3: Запустить тест — убедиться что FAIL**

```bash
cd mvps/analytics-hub && ./gradlew test --tests "ru.alabuga.analytics.service.DatareonServiceTest"
```

Ожидаемый результат: FAILED

- [ ] **Step 4: Создать `DatareonService.java`**

```java
package ru.alabuga.analytics.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.analytics.dto.datareon.EventDto;
import ru.alabuga.analytics.dto.datareon.EventFilterRequest;
import ru.alabuga.analytics.dto.datareon.SummaryDto;
import ru.alabuga.analytics.model.InboundEvent;
import ru.alabuga.analytics.model.OutboundData;
import ru.alabuga.analytics.repository.InboundEventRepository;
import ru.alabuga.analytics.repository.OutboundDataRepository;
import ru.alabuga.analytics.util.SystemMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DatareonService {

    private final InboundEventRepository inboundEventRepository;
    private final OutboundDataRepository outboundDataRepository;

    public SummaryDto getSummary(String period) {
        LocalDateTime since = sinceByPeriod(period);
        LocalDateTime stuckThreshold = LocalDateTime.now().minusMinutes(15);

        long inboundTotal = inboundEventRepository.countByCreatedAtAfter(since);
        long inboundSuccess = inboundEventRepository.countByStatusAndCreatedAtAfter("DONE", since);
        long inboundStuck = inboundEventRepository.countStuck(stuckThreshold);

        long outboundTotal = outboundDataRepository.countByCreatedAtAfter(since);
        long outboundSuccess = outboundDataRepository.countBySuccessTrueAndCreatedAtAfter(since);
        long outboundErrors = outboundDataRepository.countBySuccessFalseAndCreatedAtAfter(since);
        long outboundStuck = outboundDataRepository.countStuck(stuckThreshold);

        return new SummaryDto(
            inboundTotal + outboundTotal,
            inboundSuccess + outboundSuccess,
            outboundErrors,
            inboundStuck + outboundStuck
        );
    }

    public List<EventDto> getEvents(EventFilterRequest filter) {
        LocalDateTime since = sinceByPeriod(filter.period());
        LocalDateTime stuckThreshold = LocalDateTime.now().minusMinutes(15);
        PageRequest pageable = PageRequest.of(filter.page(), filter.size());

        List<EventDto> events = new ArrayList<>();

        if ("STUCK".equals(filter.status())) {
            inboundEventRepository.findStuck(stuckThreshold, pageable)
                .forEach(e -> events.add(toInboundDto(e, stuckThreshold)));
            outboundDataRepository.findStuck(stuckThreshold, pageable)
                .forEach(d -> events.add(toOutboundDto(d, stuckThreshold)));
        } else if ("ERROR".equals(filter.status())) {
            inboundEventRepository.findErrors(since, pageable)
                .forEach(e -> events.add(toInboundDto(e, stuckThreshold)));
            outboundDataRepository.findErrors(since, pageable)
                .forEach(d -> events.add(toOutboundDto(d, stuckThreshold)));
        } else {
            inboundEventRepository.findByCreatedAtAfterOrderByCreatedAtDesc(since, pageable)
                .forEach(e -> events.add(toInboundDto(e, stuckThreshold)));
            outboundDataRepository.findByCreatedAtAfterOrderByCreatedAtDesc(since, pageable)
                .forEach(d -> events.add(toOutboundDto(d, stuckThreshold)));
        }

        List<EventDto> result = events.stream()
            .filter(e -> "ALL".equals(filter.system()) || filter.system().equals(e.system()))
            .sorted(Comparator.comparing(EventDto::time).reversed())
            .limit(filter.size())
            .toList();

        return result;
    }

    private EventDto toInboundDto(InboundEvent e, LocalDateTime stuckThreshold) {
        return new EventDto(
            e.getId().toString(),
            e.getCreatedAt(),
            "INBOUND",
            SystemMapper.fromEventCode(e.getEventCode()),
            e.getEventName() != null ? e.getEventName() : e.getEventCode(),
            resolveInboundStatus(e, stuckThreshold),
            e.getStatusDetails()
        );
    }

    private EventDto toOutboundDto(OutboundData d, LocalDateTime stuckThreshold) {
        return new EventDto(
            d.getId().toString(),
            d.getCreatedAt(),
            "OUTBOUND",
            SystemMapper.fromMessageType(d.getMessageType()),
            d.getMessageType(),
            resolveOutboundStatus(d, stuckThreshold),
            d.getErrorMessage()
        );
    }

    private String resolveInboundStatus(InboundEvent e, LocalDateTime stuckThreshold) {
        if ("DONE".equals(e.getStatus())) return "Успешно";
        if (e.getStatus() != null && e.getStatus().contains("ERROR")) return "Ошибка";
        if (e.getCreatedAt().isBefore(stuckThreshold)) return "Завис";
        return "В обработке";
    }

    private String resolveOutboundStatus(OutboundData d, LocalDateTime stuckThreshold) {
        if (Boolean.TRUE.equals(d.getSuccess())) return "Успешно";
        if (Boolean.FALSE.equals(d.getSuccess())) return "Ошибка";
        if (d.getCreatedAt().isBefore(stuckThreshold)) return "Завис";
        return "В обработке";
    }

    private LocalDateTime sinceByPeriod(String period) {
        return switch (period) {
            case "6h" -> LocalDateTime.now().minusHours(6);
            case "24h" -> LocalDateTime.now().minusHours(24);
            default -> LocalDateTime.now().minusHours(1);
        };
    }
}
```

- [ ] **Step 5: Запустить тест — убедиться что PASS**

```bash
cd mvps/analytics-hub && ./gradlew test --tests "ru.alabuga.analytics.service.DatareonServiceTest"
```

Ожидаемый результат: `BUILD SUCCESSFUL`

- [ ] **Step 6: Создать `DatareonController.java`**

```java
package ru.alabuga.analytics.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.analytics.dto.datareon.EventDto;
import ru.alabuga.analytics.dto.datareon.EventFilterRequest;
import ru.alabuga.analytics.dto.datareon.SummaryDto;
import ru.alabuga.analytics.service.DatareonService;

import java.util.List;

@Tag(name = "datareon")
@RestController
@RequestMapping("/datareon")
@RequiredArgsConstructor
public class DatareonController {

    private final DatareonService datareonService;

    @Operation(summary = "Счётчики пакетов за период")
    @GetMapping("/summary")
    public SummaryDto getSummary(@RequestParam(defaultValue = "1h") String period) {
        return datareonService.getSummary(period);
    }

    @Operation(summary = "Список событий с фильтрацией")
    @GetMapping("/events")
    public List<EventDto> getEvents(
            @RequestParam(defaultValue = "1h") String period,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "ALL") String system,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return datareonService.getEvents(new EventFilterRequest(period, status, system, page, size));
    }
}
```

- [ ] **Step 7: Commit**

```bash
git add mvps/analytics-hub/src/
git commit -m "feat(analytics-hub): add Datareon summary and events endpoints"
```

---

## Task 6: Orders DTOs, Service, Controller (TDD)

**Files:**
- Create: `src/main/java/ru/alabuga/analytics/dto/orders/OrderSummaryDto.java`
- Create: `src/main/java/ru/alabuga/analytics/dto/orders/StuckOrderDto.java`
- Create: `src/main/java/ru/alabuga/analytics/dto/orders/OrderFilterRequest.java`
- Create: `src/main/java/ru/alabuga/analytics/service/OrderService.java`
- Create: `src/main/java/ru/alabuga/analytics/controller/OrderController.java`
- Create: `src/test/java/ru/alabuga/analytics/service/OrderServiceTest.java`

Жизненный цикл заказа: `DRAFT → ON_REVIEW → ACCEPTED → IN_PROGRESS → DONE`

- [ ] **Step 1: Создать DTO-классы**

`OrderSummaryDto.java`:
```java
package ru.alabuga.analytics.dto.orders;

public record OrderSummaryDto(
    long draft,
    long onReview,
    long accepted,
    long inProgress,
    long done,
    String type    // "RECEIVING" | "SHIPPING"
) {}
```

`StuckOrderDto.java`:
```java
package ru.alabuga.analytics.dto.orders;

import java.time.LocalDateTime;

public record StuckOrderDto(
    String id,
    Integer number,
    String type,           // "RECEIVING" | "SHIPPING"
    String orderStatus,
    String clientId,
    LocalDateTime updatedAt,
    long minutesInStatus
) {}
```

`OrderFilterRequest.java`:
```java
package ru.alabuga.analytics.dto.orders;

public record OrderFilterRequest(
    String type    // "ALL" | "RECEIVING" | "SHIPPING", default "ALL"
) {
    public OrderFilterRequest {
        if (type == null) type = "ALL";
    }
}
```

- [ ] **Step 2: Написать тест для OrderService**

```java
package ru.alabuga.analytics.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.alabuga.analytics.dto.orders.StuckOrderDto;
import ru.alabuga.analytics.model.ReceivingOrder;
import ru.alabuga.analytics.model.ShippingOrder;
import ru.alabuga.analytics.repository.ReceivingOrderRepository;
import ru.alabuga.analytics.repository.ShippingOrderRepository;
import ru.alabuga.analytics.repository.ClientRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    ReceivingOrderRepository receivingOrderRepository;

    @Mock
    ShippingOrderRepository shippingOrderRepository;

    @Mock
    ClientRepository clientRepository;

    @InjectMocks
    OrderService orderService;

    @Test
    void stuck_orders_include_receiving_and_shipping() {
        ReceivingOrder receiving = new ReceivingOrder();
        setField(receiving, "id", UUID.randomUUID());
        setField(receiving, "number", 42);
        setField(receiving, "orderStatus", "IN_PROGRESS");
        setField(receiving, "clientId", UUID.randomUUID());
        setField(receiving, "updatedAt", LocalDateTime.now().minusHours(5));

        when(receivingOrderRepository.findStuck(any())).thenReturn(List.of(receiving));
        when(shippingOrderRepository.findStuck(any())).thenReturn(List.of());
        when(clientRepository.findAllById(any())).thenReturn(List.of());

        List<StuckOrderDto> stuck = orderService.getStuck("ALL");

        assertThat(stuck).hasSize(1);
        assertThat(stuck.get(0).type()).isEqualTo("RECEIVING");
        assertThat(stuck.get(0).minutesInStatus()).isGreaterThan(240);
    }

    private void setField(Object obj, String field, Object value) {
        try {
            var f = obj.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(obj, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
```

- [ ] **Step 3: Запустить тест — убедиться что FAIL**

```bash
cd mvps/analytics-hub && ./gradlew test --tests "ru.alabuga.analytics.service.OrderServiceTest"
```

Ожидаемый результат: FAILED

- [ ] **Step 4: Создать `OrderService.java`**

```java
package ru.alabuga.analytics.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.analytics.dto.orders.OrderFilterRequest;
import ru.alabuga.analytics.dto.orders.OrderSummaryDto;
import ru.alabuga.analytics.dto.orders.StuckOrderDto;
import ru.alabuga.analytics.model.Client;
import ru.alabuga.analytics.model.ReceivingOrder;
import ru.alabuga.analytics.model.ShippingOrder;
import ru.alabuga.analytics.repository.ClientRepository;
import ru.alabuga.analytics.repository.ReceivingOrderRepository;
import ru.alabuga.analytics.repository.ShippingOrderRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final ReceivingOrderRepository receivingOrderRepository;
    private final ShippingOrderRepository shippingOrderRepository;
    private final ClientRepository clientRepository;

    public List<OrderSummaryDto> getSummary() {
        return List.of(
            new OrderSummaryDto(
                receivingOrderRepository.countByOrderStatus("DRAFT"),
                receivingOrderRepository.countByOrderStatus("ON_REVIEW"),
                receivingOrderRepository.countByOrderStatus("ACCEPTED"),
                receivingOrderRepository.countByOrderStatus("IN_PROGRESS"),
                receivingOrderRepository.countByOrderStatus("DONE"),
                "RECEIVING"
            ),
            new OrderSummaryDto(
                shippingOrderRepository.countByOrderStatus("DRAFT"),
                shippingOrderRepository.countByOrderStatus("ON_REVIEW"),
                shippingOrderRepository.countByOrderStatus("ACCEPTED"),
                shippingOrderRepository.countByOrderStatus("IN_PROGRESS"),
                shippingOrderRepository.countByOrderStatus("DONE"),
                "SHIPPING"
            )
        );
    }

    public List<StuckOrderDto> getStuck(String type) {
        LocalDateTime threshold = LocalDateTime.now().minusHours(4);
        Map<UUID, String> clientNames = new HashMap<>();

        List<StuckOrderDto> result = new ArrayList<>();

        if (!"SHIPPING".equals(type)) {
            List<ReceivingOrder> stuckReceiving = receivingOrderRepository.findStuck(threshold);
            collectClientNames(stuckReceiving.stream().map(ReceivingOrder::getClientId).toList(), clientNames);
            stuckReceiving.stream()
                .map(o -> toStuckDto(o.getId(), o.getNumber(), "RECEIVING", o.getOrderStatus(),
                    o.getClientId(), o.getUpdatedAt(), clientNames))
                .forEach(result::add);
        }

        if (!"RECEIVING".equals(type)) {
            List<ShippingOrder> stuckShipping = shippingOrderRepository.findStuck(threshold);
            collectClientNames(stuckShipping.stream().map(ShippingOrder::getClientId).toList(), clientNames);
            stuckShipping.stream()
                .map(o -> toStuckDto(o.getId(), o.getNumber(), "SHIPPING", o.getOrderStatus(),
                    o.getClientId(), o.getUpdatedAt(), clientNames))
                .forEach(result::add);
        }

        result.sort(Comparator.comparing(StuckOrderDto::updatedAt));
        return result;
    }

    private void collectClientNames(List<UUID> ids, Map<UUID, String> target) {
        clientRepository.findAllById(ids)
            .forEach(c -> target.put(c.getId(), c.getName()));
    }

    private StuckOrderDto toStuckDto(UUID id, Integer number, String type, String status,
                                     UUID clientId, LocalDateTime updatedAt, Map<UUID, String> clientNames) {
        long minutes = updatedAt != null
            ? ChronoUnit.MINUTES.between(updatedAt, LocalDateTime.now())
            : 0;
        return new StuckOrderDto(
            id.toString(), number, type, status,
            clientNames.getOrDefault(clientId, clientId != null ? clientId.toString() : "—"),
            updatedAt, minutes
        );
    }
}
```

- [ ] **Step 5: Запустить тест — убедиться что PASS**

```bash
cd mvps/analytics-hub && ./gradlew test --tests "ru.alabuga.analytics.service.OrderServiceTest"
```

Ожидаемый результат: `BUILD SUCCESSFUL`

- [ ] **Step 6: Создать `OrderController.java`**

```java
package ru.alabuga.analytics.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.analytics.dto.orders.OrderSummaryDto;
import ru.alabuga.analytics.dto.orders.StuckOrderDto;
import ru.alabuga.analytics.service.OrderService;

import java.util.List;

@Tag(name = "orders")
@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "Сводка по статусам заказов")
    @GetMapping("/summary")
    public List<OrderSummaryDto> getSummary() {
        return orderService.getSummary();
    }

    @Operation(summary = "Зависшие заказы (IN_PROGRESS > 4 часов)")
    @GetMapping("/stuck")
    public List<StuckOrderDto> getStuck(
            @RequestParam(defaultValue = "ALL") String type) {
        return orderService.getStuck(type);
    }
}
```

- [ ] **Step 7: Commit**

```bash
git add mvps/analytics-hub/src/
git commit -m "feat(analytics-hub): add Orders summary and stuck endpoints"
```

---

## Task 7: Security config (открытый для dev)

**Files:**
- Create: `src/main/java/ru/alabuga/analytics/config/SecurityConfig.java`

- [ ] **Step 1: Создать `SecurityConfig.java`**

```java
package ru.alabuga.analytics.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

- [ ] **Step 2: Запустить все тесты**

```bash
cd mvps/analytics-hub && ./gradlew test
```

Ожидаемый результат: все тесты зелёные, `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add mvps/analytics-hub/src/main/java/ru/alabuga/analytics/config/
git commit -m "feat(analytics-hub): add open security config for dev"
```

---

## Task 8: Bootstrap frontend

**Files:**
- Create: `mvps/analytics-hub/frontend/` (весь проект через Vite)

- [ ] **Step 1: Создать React проект через Vite**

```bash
cd mvps/analytics-hub && npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
```

- [ ] **Step 2: Установить зависимости**

```bash
cd mvps/analytics-hub/frontend && npm install @mui/material @mui/icons-material @emotion/react @emotion/styled axios react-router-dom
```

- [ ] **Step 3: Создать `vite.config.ts`** (заменить существующий)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8091',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 4: Обновить `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App'

const theme = createTheme({
  palette: { mode: 'light' },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

- [ ] **Step 5: Убедиться что фронт запускается**

```bash
cd mvps/analytics-hub/frontend && npm run dev
```

Ожидаемый результат: приложение открывается на http://localhost:5174

- [ ] **Step 6: Остановить dev-сервер (Ctrl+C) и commit**

```bash
git add mvps/analytics-hub/frontend/
git commit -m "feat(analytics-hub): bootstrap React+Vite+MUI frontend"
```

---

## Task 9: API-слой и usePolling hook

**Files:**
- Create: `frontend/src/api/datareon.ts`
- Create: `frontend/src/api/orders.ts`
- Create: `frontend/src/hooks/usePolling.ts`

- [ ] **Step 1: Создать `src/api/datareon.ts`**

```typescript
import axios from 'axios'

export interface EventDto {
  id: string
  time: string
  direction: 'INBOUND' | 'OUTBOUND'
  system: string
  eventType: string
  status: string
  error: string | null
}

export interface SummaryDto {
  total: number
  success: number
  errors: number
  stuck: number
}

export type PeriodFilter = '1h' | '6h' | '24h'
export type StatusFilter = 'ALL' | 'ERROR' | 'STUCK'
export type SystemFilter = 'ALL' | 'WMS' | 'TOS' | '1C' | 'DATAREON'

export const datareonApi = {
  getSummary: (period: PeriodFilter = '1h') =>
    axios.get<SummaryDto>('/api/datareon/summary', { params: { period } }).then(r => r.data),

  getEvents: (params: { period: PeriodFilter; status: StatusFilter; system: SystemFilter; page: number; size: number }) =>
    axios.get<EventDto[]>('/api/datareon/events', { params }).then(r => r.data),
}
```

- [ ] **Step 2: Создать `src/api/orders.ts`**

```typescript
import axios from 'axios'

export interface OrderSummaryDto {
  draft: number
  onReview: number
  accepted: number
  inProgress: number
  done: number
  type: 'RECEIVING' | 'SHIPPING'
}

export interface StuckOrderDto {
  id: string
  number: number
  type: 'RECEIVING' | 'SHIPPING'
  orderStatus: string
  clientId: string
  updatedAt: string
  minutesInStatus: number
}

export const ordersApi = {
  getSummary: () =>
    axios.get<OrderSummaryDto[]>('/api/orders/summary').then(r => r.data),

  getStuck: (type: 'ALL' | 'RECEIVING' | 'SHIPPING' = 'ALL') =>
    axios.get<StuckOrderDto[]>('/api/orders/stuck', { params: { type } }).then(r => r.data),
}
```

- [ ] **Step 3: Создать `src/hooks/usePolling.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react'

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 10_000
): { data: T | null; error: boolean; loading: boolean } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const result = await fetcher()
      setData(result)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, intervalMs)
    return () => clearInterval(interval)
  }, [fetch, intervalMs])

  return { data, error, loading }
}
```

- [ ] **Step 4: Commit**

```bash
git add mvps/analytics-hub/frontend/src/api/ mvps/analytics-hub/frontend/src/hooks/
git commit -m "feat(analytics-hub): add API clients and usePolling hook"
```

---

## Task 10: Layout, StatCard, App роутинг

**Files:**
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/components/StatCard.tsx`
- Create (replace): `frontend/src/App.tsx`

- [ ] **Step 1: Создать `src/components/StatCard.tsx`**

```tsx
import { Card, CardContent, Typography, Box } from '@mui/material'

interface Props {
  label: string
  value: number
  color?: 'success' | 'error' | 'warning' | 'info' | 'default'
}

const colorMap = {
  success: '#2e7d32',
  error: '#c62828',
  warning: '#e65100',
  info: '#01579b',
  default: '#37474f',
}

export default function StatCard({ label, value, color = 'default' }: Props) {
  return (
    <Card variant="outlined" sx={{ minWidth: 140 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" fontWeight="bold" sx={{ color: colorMap[color] }}>
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Создать `src/components/Layout.tsx`**

```tsx
import { AppBar, Box, Container, Tab, Tabs, Toolbar, Typography } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const tab = location.pathname.startsWith('/orders') ? 1 : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            ALIS Analytics Hub
          </Typography>
        </Toolbar>
        <Tabs value={tab} textColor="inherit" indicatorColor="secondary"
          sx={{ px: 2 }}>
          <Tab label="Datareon" onClick={() => navigate('/')} />
          <Tab label="Заказы" onClick={() => navigate('/orders')} />
        </Tabs>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
```

- [ ] **Step 3: Заменить `src/App.tsx`**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DatareonPage from './pages/DatareonPage'
import OrdersPage from './pages/OrdersPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DatareonPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add mvps/analytics-hub/frontend/src/components/ mvps/analytics-hub/frontend/src/App.tsx
git commit -m "feat(analytics-hub): add Layout, StatCard, App routing"
```

---

## Task 11: DatareonPage (главный экран)

**Files:**
- Create: `frontend/src/pages/DatareonPage.tsx`

- [ ] **Step 1: Создать `src/pages/DatareonPage.tsx`**

```tsx
import { useState, useCallback } from 'react'
import {
  Alert, Box, Chip, CircularProgress, FormControl, Grid,
  InputLabel, MenuItem, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Typography
} from '@mui/material'
import StatCard from '../components/StatCard'
import { usePolling } from '../hooks/usePolling'
import { datareonApi, PeriodFilter, StatusFilter, SystemFilter, EventDto } from '../api/datareon'

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  'Успешно': 'success',
  'В обработке': 'default',
  'Завис': 'warning',
  'Ошибка': 'error',
}

export default function DatareonPage() {
  const [period, setPeriod] = useState<PeriodFilter>('1h')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [systemFilter, setSystemFilter] = useState<SystemFilter>('ALL')

  const summaryFetcher = useCallback(() => datareonApi.getSummary(period), [period])
  const { data: summary, error: summaryError } = usePolling(summaryFetcher)

  const eventsFetcher = useCallback(
    () => datareonApi.getEvents({ period, status: statusFilter, system: systemFilter, page: 0, size: 50 }),
    [period, statusFilter, systemFilter]
  )
  const { data: events, error: eventsError, loading } = usePolling(eventsFetcher)

  const hasError = summaryError || eventsError

  return (
    <Stack spacing={3}>
      {hasError && (
        <Alert severity="error">Нет соединения с бэкендом. Данные могут быть устаревшими.</Alert>
      )}

      {summary && (
        <Grid container spacing={2}>
          <Grid item><StatCard label="Всего" value={summary.total} /></Grid>
          <Grid item><StatCard label="Успешно" value={summary.success} color="success" /></Grid>
          <Grid item><StatCard label="Ошибки" value={summary.errors} color="error" /></Grid>
          <Grid item><StatCard label="Зависли" value={summary.stuck} color="warning" /></Grid>
        </Grid>
      )}

      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Период</InputLabel>
          <Select value={period} label="Период" onChange={e => setPeriod(e.target.value as PeriodFilter)}>
            <MenuItem value="1h">Последний час</MenuItem>
            <MenuItem value="6h">6 часов</MenuItem>
            <MenuItem value="24h">24 часа</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Статус</InputLabel>
          <Select value={statusFilter} label="Статус" onChange={e => setStatusFilter(e.target.value as StatusFilter)}>
            <MenuItem value="ALL">Все</MenuItem>
            <MenuItem value="ERROR">Ошибки</MenuItem>
            <MenuItem value="STUCK">Зависли</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Система</InputLabel>
          <Select value={systemFilter} label="Система" onChange={e => setSystemFilter(e.target.value as SystemFilter)}>
            <MenuItem value="ALL">Все</MenuItem>
            <MenuItem value="WMS">WMS</MenuItem>
            <MenuItem value="TOS">TOS</MenuItem>
            <MenuItem value="1C">1C</MenuItem>
            <MenuItem value="DATAREON">Datareon</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading && <CircularProgress />}

      {events && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Время</TableCell>
                <TableCell>Направление</TableCell>
                <TableCell>Система</TableCell>
                <TableCell>Тип события</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Ошибка</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">Нет данных за выбранный период</Typography>
                  </TableCell>
                </TableRow>
              )}
              {events.map((e: EventDto) => (
                <TableRow key={e.id} hover>
                  <TableCell>{new Date(e.time).toLocaleString('ru-RU')}</TableCell>
                  <TableCell>
                    <Chip size="small" label={e.direction === 'INBOUND' ? '← Входящий' : '→ Исходящий'}
                      variant="outlined" />
                  </TableCell>
                  <TableCell>{e.system}</TableCell>
                  <TableCell>{e.eventType}</TableCell>
                  <TableCell>
                    <Chip size="small" label={e.status} color={STATUS_COLORS[e.status] ?? 'default'} />
                  </TableCell>
                  <TableCell sx={{ color: 'error.main', maxWidth: 300, wordBreak: 'break-word' }}>
                    {e.error ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add mvps/analytics-hub/frontend/src/pages/DatareonPage.tsx
git commit -m "feat(analytics-hub): add DatareonPage with summary cards and events table"
```

---

## Task 12: OrdersPage (вкладка заказов)

**Files:**
- Create: `frontend/src/pages/OrdersPage.tsx`

- [ ] **Step 1: Создать `src/pages/OrdersPage.tsx`**

```tsx
import { useState, useCallback } from 'react'
import {
  Alert, Box, CircularProgress, Divider, FormControl, Grid,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography
} from '@mui/material'
import StatCard from '../components/StatCard'
import { usePolling } from '../hooks/usePolling'
import { ordersApi, OrderSummaryDto, StuckOrderDto } from '../api/orders'

function SummarySection({ data, label }: { data: OrderSummaryDto; label: string }) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{label}</Typography>
      <Grid container spacing={2}>
        <Grid item><StatCard label="Черновик" value={data.draft} /></Grid>
        <Grid item><StatCard label="На проверке" value={data.onReview} /></Grid>
        <Grid item><StatCard label="Принят" value={data.accepted} /></Grid>
        <Grid item><StatCard label="В обработке" value={data.inProgress} color="info" /></Grid>
        <Grid item><StatCard label="Завершён" value={data.done} color="success" /></Grid>
      </Grid>
    </Box>
  )
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h} ч ${m} мин`
}

export default function OrdersPage() {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RECEIVING' | 'SHIPPING'>('ALL')

  const summaryFetcher = useCallback(() => ordersApi.getSummary(), [])
  const { data: summary, error: summaryError } = usePolling(summaryFetcher)

  const stuckFetcher = useCallback(() => ordersApi.getStuck(typeFilter), [typeFilter])
  const { data: stuck, error: stuckError, loading } = usePolling(stuckFetcher)

  const receiving = summary?.find(s => s.type === 'RECEIVING')
  const shipping = summary?.find(s => s.type === 'SHIPPING')

  return (
    <Stack spacing={3}>
      {(summaryError || stuckError) && (
        <Alert severity="error">Нет соединения с бэкендом. Данные могут быть устаревшими.</Alert>
      )}

      {receiving && <SummarySection data={receiving} label="Приёмка" />}
      {shipping && (
        <>
          <Divider />
          <SummarySection data={shipping} label="Отгрузка" />
        </>
      )}

      <Divider />

      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="subtitle1" fontWeight="bold">
          Зависшие заказы (IN_PROGRESS более 4 часов)
        </Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Тип</InputLabel>
          <Select value={typeFilter} label="Тип"
            onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}>
            <MenuItem value="ALL">Все</MenuItem>
            <MenuItem value="RECEIVING">Приёмка</MenuItem>
            <MenuItem value="SHIPPING">Отгрузка</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading && <CircularProgress />}

      {stuck && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Тип</TableCell>
                <TableCell>Номер</TableCell>
                <TableCell>Клиент</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Время в статусе</TableCell>
                <TableCell>Обновлён</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stuck.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">Зависших заказов нет</Typography>
                  </TableCell>
                </TableRow>
              )}
              {stuck.map((o: StuckOrderDto) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.type === 'RECEIVING' ? 'Приёмка' : 'Отгрузка'}</TableCell>
                  <TableCell>#{o.number}</TableCell>
                  <TableCell>{o.clientId}</TableCell>
                  <TableCell>{o.orderStatus}</TableCell>
                  <TableCell sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                    {formatDuration(o.minutesInStatus)}
                  </TableCell>
                  <TableCell>
                    {o.updatedAt ? new Date(o.updatedAt).toLocaleString('ru-RU') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add mvps/analytics-hub/frontend/src/pages/OrdersPage.tsx
git commit -m "feat(analytics-hub): add OrdersPage with summary and stuck orders table"
```

---

## Task 13: Финальная проверка и регистрация в openclaw

- [ ] **Step 1: Запустить все backend тесты**

```bash
cd mvps/analytics-hub && ./gradlew test
```

Ожидаемый результат: все тесты зелёные, `BUILD SUCCESSFUL`

- [ ] **Step 2: TypeScript проверка фронта**

```bash
cd mvps/analytics-hub/frontend && npm run build
```

Ожидаемый результат: `dist/` создан без ошибок TypeScript

- [ ] **Step 3: Добавить проект в `openclaw/projects.json`**

Открой `openclaw/projects.json` и добавь в массив `projects`:

```json
{
  "id": "analytics-hub",
  "name": "Analytics Hub — Дашборд техподдержки",
  "description": "Мониторинг пакетов Datareon и статусов заказов ALIS в реальном времени. Read-only дашборд для техподдержки — счётчики успешных/зависших/ошибочных пакетов и список зависших заказов.",
  "status": "done",
  "stack": {
    "backend": "Java 17 + Spring Boot 3.3.0 + Spring Data JPA",
    "frontend": "React 18 + TypeScript + MUI v6 + Vite",
    "db": "ALIS PostgreSQL (read-only, схема alis)",
    "auth": "нет (v1)"
  },
  "path": "mvps/analytics-hub",
  "key_features": [
    "Счётчики пакетов Datareon за 1ч/6ч/24ч: всего/успешно/ошибки/зависли",
    "Таблица событий с фильтрами по системе, статусу, периоду",
    "Сводка заказов по статусам (приёмка + отгрузка отдельно)",
    "Таблица зависших заказов (IN_PROGRESS > 4 часов)",
    "Polling каждые 10 секунд без перезагрузки страницы"
  ],
  "key_tables": ["inbound_event", "outbound_data", "receiving_order", "shipping_order", "client"],
  "created": "2026-05-26",
  "updated": "2026-05-26"
}
```

- [ ] **Step 4: Финальный commit**

```bash
git add openclaw/projects.json
git commit -m "feat(analytics-hub): register in openclaw projects registry"
```
