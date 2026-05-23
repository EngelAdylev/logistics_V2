# Railway Dislocation — Java Rewrite Design

**Дата:** 2026-05-24  
**Статус:** Approved  
**Проект:** `mvps/railway-dislocation-java/`

---

## Контекст

Переписываем существующую Python/FastAPI систему дислокации ж/д вагонов с нуля на Java/Spring Boot — тот же стек, что и основной ALIS. Цель: убрать легаси, упростить логику, сделать карту вагонов в реальном времени.

**Что не так с текущей Python-версией:**
- 8-шаговый синк через планировщик — сложно, непонятно, ломается
- 15+ таблиц, часть не используется (`wagon_trip_operations` не заполняется)
- Параллельные модели данных (`tracking_wagons` + `wagon_trips`)
- Самописный JWT вместо Keycloak
- Сложная логика архивации рейсов

---

## Архитектура

### Тип сервиса
Отдельный Spring Boot сервис в `mvps/railway-dislocation-java/`. Не модифицируем ALIS backend.

### Структура проекта (multi-module Gradle, как ALIS)
```
railway-dislocation-java/
├── db-layer/          ← Entity, Repository, DaoService, Filter, Predicate (QueryDSL)
├── web-layer/         ← Controller, Service (бизнес-логика), DTO, Config
├── frontend/          ← React 18 + TypeScript + MUI v6 + Leaflet
├── docker-compose.yml
└── build.gradle
```

### База данных
- Схема `dislocation` в той же PostgreSQL что ALIS
- Read-only доступ к схеме `alis` (таблицы `railway_carriage`, `etran_invoice`)
- Write только в схему `dislocation`

### Аутентификация
- Keycloak OAuth2, realm `KIS` — тот же что ALIS
- `spring-boot-starter-oauth2-resource-server`
- URL через env var: `KEYCLOAK_ISSUER_URI` (дефолт: `http://localhost:8080/realms/KIS`)
- Локально и Portainer — один образ, разные env vars

### Деплой
- Docker Compose: `backend:8080` + `frontend:3000`
- Portainer на работе — те же контейнеры, `KEYCLOAK_ISSUER_URI` переопределяется

---

## Модель данных

4 таблицы в схеме `dislocation`:

### `railway_station` — справочник станций РЖД с координатами
```sql
code    VARCHAR PRIMARY KEY  -- код станции РЖД ("648400")
name    VARCHAR              -- "Круглое Поле"
lat     DECIMAL(9,6)
lng     DECIMAL(9,6)
```
Загружается один раз через `POST /admin/sync-stations` из CSV-справочника станций РЖД.

### `wagon` — текущее состояние вагона (витрина для карты)
```sql
id                          UUID PRIMARY KEY
wagon_number                VARCHAR UNIQUE        -- "42691234"
station_code                VARCHAR               -- где сейчас
station_name                VARCHAR
current_train_number        VARCHAR
current_train_index         VARCHAR
remaining_distance          INTEGER               -- км до пункта назначения
operation_code              VARCHAR               -- 96/20/80/85/61
operation_name              VARCHAR               -- "Прибыл" / "Убыл"
last_seen_at                TIMESTAMP
active_trip_id              UUID FK wagon_trip
destination_station_code    VARCHAR
shipper_okpo                VARCHAR
consignee_okpo              VARCHAR
container_numbers           JSONB                 -- ["WIKU5270869"]
cargo_weight                INTEGER
date_arrival_at_destination TIMESTAMP             -- плановая дата прибытия
```

### `wagon_trip` — рейс вагона (одна поездка A→B)
```sql
id                UUID PRIMARY KEY
wagon_id          UUID FK wagon
dep_station_code  VARCHAR
dep_station_name  VARCHAR
dst_station_code  VARCHAR
dst_station_name  VARCHAR
started_at        TIMESTAMP
finished_at       TIMESTAMP    -- NULL = рейс активен
status            VARCHAR      -- ACTIVE / COMPLETED
```

**Правило определения рейса:**
Новый рейс создаётся если нет активного с той же `dep_station_code` и той же датой `started_at` (день). Два условия, без сложной нормализации дат.

**Правило закрытия рейса:**
`operation_code = '96'` (Прибыл) И `station_code = dst_station_code` → `status = COMPLETED`, `finished_at = now()`.

### `dislocation_event` — сырой лог от РЖД (~30 полей)
```sql
id                              UUID PRIMARY KEY
rzd_id                          UUID UNIQUE       -- "_id" от РЖД (идемпотентность)
received_at                     TIMESTAMP

-- Вагон
wagon_number                    VARCHAR
waybill_number                  VARCHAR
wagon_type                      VARCHAR

-- Рейс
flight_start_date               TIMESTAMP
flight_start_station_code       VARCHAR           -- ключ для определения рейса
flight_end_date                 TIMESTAMP
destination_station_code        VARCHAR
sending_number                  VARCHAR

-- Операция
station_code                    VARCHAR
operation_code                  VARCHAR
operation_datetime              TIMESTAMP

-- Поезд
train_number                    VARCHAR
train_index                     VARCHAR
wagon_position                  INTEGER           -- позиция в поезде

-- Расстояния
remaining_distance              INTEGER
distance_traveled               INTEGER
total_distance                  INTEGER

-- Груз
gng_code                        VARCHAR
cargo_weight                    INTEGER

-- Стороны
shipper_code                    VARCHAR
shipper_okpo                    VARCHAR
consignee_code                  VARCHAR
consignee_okpo                  VARCHAR

-- Плановые даты
date_departure_from_sender      TIMESTAMP
date_arrival_at_destination     TIMESTAMP

-- Контейнеры
container_numbers               JSONB             -- вместо 12 отдельных колонок
number_loaded_containers        INTEGER
number_empty_containers         INTEGER
number_of_seals                 INTEGER

-- Привязка
trip_id                         UUID FK wagon_trip
```

**Что выброшено из CSV (63 поля → ~30):** технические пробеги (mileage_*), коды путей (park_number, path_number), коды дорог РЖД, idle_time_*, special_mark_*, operation_cost_code, country_start_flight.

---

## Поток обработки webhook

Один POST — одна транзакция — линейно:

```
POST /api/webhook/dislocation
  1. Парсим тело → DislocationEventDto
  2. Проверяем rzd_id: если уже есть → 200 OK (идемпотентность, не обрабатываем)
  3. Сохраняем dislocation_event (trip_id = null)
  4. Upsert wagon: если event_datetime > wagon.last_seen_at → обновляем
  5. Ищем/создаём wagon_trip:
       find where dep_station_code = event.flight_start_station_code
                AND DATE(started_at) = DATE(event.flight_start_date)
                AND status = ACTIVE
       если не найден → создаём новый
  6. UPDATE dislocation_event SET trip_id
  7. Проверяем закрытие рейса:
       operation_code = '96' AND station_code = trip.dst_station_code
       → trip.status = COMPLETED, wagon.active_trip_id = null
  8. Коммит
```

**Нет планировщика. Нет архивации по таймауту. Нет fail-safe. Всё обрабатывается в момент прихода события.**

---

## API

### Webhook
```
POST /api/webhook/dislocation    ← приём пакетов от РЖД
```

### Вагоны
```
POST /api/wagons/page            ← список с фильтрами и пагинацией
GET  /api/wagons/{id}            ← детальная карточка
GET  /api/wagons/map             ← лёгкий эндпоинт для карты (id, coords, status)
```

### Рейсы
```
POST /api/trips/page             ← список с фильтрами
GET  /api/trips/{id}             ← детальная карточка
GET  /api/trips/{id}/events      ← хронология операций рейса
```

### Станции
```
GET  /api/stations               ← справочник
GET  /api/stations/{code}        ← по коду РЖД
```

### Admin
```
POST /api/admin/sync-stations    ← загрузить CSV справочника станций
GET  /api/admin/stats            ← статистика системы
```

**Фильтры `POST /api/wagons/page`:**
```json
{
  "filter": {
    "wagonNumber": "42691234",
    "trainNumber": "3221",
    "stationCode": "648400",
    "operationCode": "96",
    "destinationStationCode": "648400",
    "hasContainers": true
  },
  "page": 0,
  "size": 50
}
```

**`GET /api/wagons/map` — минимум данных для быстрой карты:**
```json
[{
  "id": "uuid",
  "wagonNumber": "42691234",
  "lat": 55.83,
  "lng": 49.07,
  "remainingDistance": 140,
  "operationCode": "20",
  "trainNumber": "3221",
  "destinationStationCode": "648400"
}]
```

---

## Карта

**Стек:** React + Leaflet + OpenStreetMap (бесплатно, без API-ключей)

**Координаты станций:** CSV-справочник станций РЖД → загружается в `railway_station` → Leaflet читает через `/api/wagons/map`

**Маркеры:**
- Зелёный: едет к нам (destination = 648400)
- Синий: едет от нас
- Красный: на станции 648400

**Popup по клику:** номер вагона, поезд, станция, км до Круглого Поля, контейнеры, плановое прибытие

**Линия маршрута:** `dislocation_event` WHERE `trip_id = ?` ORDER BY `operation_datetime` → берём `station_code` каждой операции → координаты из `railway_station` → соединяем Polyline

**Обновление:** polling каждые 60 секунд на `/api/wagons/map`

---

## Фронтенд

**Стек:** React 18 + TypeScript + Vite + MUI v6 (те же версии что ALIS)

**Тема:** копируем из ALIS `frontend/src/app/theme/` — цвета, типографика, отступы идентичны

**UIKit:** `@alabuga/pages-uikit` из Nexus (`nexus.lkds.alabuga.ru`), стандартный MUI где пакет недоступен

**Страницы:**
```
MapPage      ← карта (главная, открывается по умолчанию)
WagonsPage   ← таблица вагонов с фильтрами
TripsPage    ← таблица рейсов
TripDetail   ← карточка рейса + хронология операций
```

**Layout:** Header + Sidebar + Content — идентично ALIS

---

## Технический стек

| | |
|---|---|
| Java | 17 |
| Spring Boot | 3.3.x |
| Build | Gradle multi-module |
| ORM | Hibernate JPA + QueryDSL |
| БД | PostgreSQL (схема `dislocation`) |
| Безопасность | Keycloak OAuth2 (`spring-boot-starter-oauth2-resource-server`) |
| Документация | Swagger/OpenAPI (springdoc) |
| Миграции | Liquibase |
| Frontend | React 18 + TypeScript + Vite + MUI v6 + Leaflet |

---

## Что в v1, что в v2

**v1 (этот спек):**
- Webhook от РЖД → трекинг вагонов
- Карта с маркерами и маршрутами
- Таблица вагонов и рейсов с фильтрами
- История операций по рейсу

**v2 (позже):**
- Уведомления когда вагон достигает 648400
- Интеграция с ALIS для автосоздания рейсов в TOS
- Комментарии к вагонам/рейсам
- Аналитика и дашборд

---

## Что НЕ делаем

- Не модифицируем ALIS backend
- Не дублируем заявки (остаются в ALIS)
- Не пишем планировщик (только webhook)
- Не архивируем рейсы по таймауту (только по operation_code 96 + destination)
