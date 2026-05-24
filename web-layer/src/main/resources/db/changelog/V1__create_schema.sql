CREATE SCHEMA IF NOT EXISTS dislocation;

CREATE TABLE dislocation.railway_station (
    code    VARCHAR(20)   PRIMARY KEY,
    name    VARCHAR(255),
    lat     DECIMAL(9,6),
    lng     DECIMAL(9,6)
);

-- wagon_trip created without FK on wagon (will be added below via ALTER TABLE)
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

-- Now add the FK from wagon_trip to wagon
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
