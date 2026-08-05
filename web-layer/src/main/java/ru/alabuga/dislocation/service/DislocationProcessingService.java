package ru.alabuga.dislocation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.webhook.DislocationWebhookPayload;
import ru.alabuga.dislocation.model.*;
import ru.alabuga.dislocation.repository.*;
import ru.alabuga.dislocation.util.OperationCodeUtil;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DislocationProcessingService {

    // Станция Забайкальск (граница с Китаем) — через неё рейс считается завершённым
    private static final String ZABAIKALSK = "628406";

    // Коды операций с нулевым расстоянием, при которых рейс архивируется
    private static final Set<String> ARCHIVE_ON_ZERO_REM = Set.of("20", "43", "58", "81");

    // МСК для бизнес-даты (ключ рейса = вагон + дата в МСК + станция отправления)
    private static final ZoneId MSK = ZoneId.of("Europe/Moscow");

    private final DislocationEventRepository eventRepo;
    private final WagonRepository wagonRepo;
    private final WagonTripRepository tripRepo;

    public void process(DislocationWebhookPayload payload) {
        // 1. Идемпотентность по rzd_id
        if (eventRepo.existsByRzdId(payload.getRzdId())) {
            return;
        }
        // 1b. Логическая дедупликация: одна операция на вагон в момент времени
        if (payload.getOperationCode() != null && payload.getOperationDatetime() != null
                && eventRepo.existsByWagonNumberAndOperationCodeAndOperationDatetime(
                        payload.getWagonNumber(), payload.getOperationCode(), payload.getOperationDatetime())) {
            return;
        }

        // 2. Сохраняем сырое событие
        DislocationEvent event = toEvent(payload);
        event = eventRepo.save(event);

        // 3. Upsert вагона
        Wagon wagon = wagonRepo.findByWagonNumber(payload.getWagonNumber())
                .orElse(Wagon.builder().wagonNumber(payload.getWagonNumber()).build());

        boolean isNewerEvent = wagon.getLastSeenAt() == null
                || payload.getOperationDatetime().isAfter(wagon.getLastSeenAt());
        if (isNewerEvent) {
            updateWagon(wagon, payload);
        }
        wagon = wagonRepo.save(wagon);

        // 4. Найти или создать рейс
        boolean[] tripCreated = {false};
        WagonTrip trip = findOrCreateTrip(wagon, payload, tripCreated);

        // 5. Привязать событие к рейсу
        event.setTrip(trip);
        eventRepo.save(event);

        // 6. Нормализация: при создании нового рейса архивируем все старые активные рейсы этого вагона
        if (tripCreated[0]) {
            closeStaleTrips(wagon, trip);
        }

        // 7. Проверяем условия архивации для текущего рейса
        if (shouldArchive(payload, trip)) {
            trip.setStatus(TripStatus.COMPLETED);
            trip.setFinishedAt(Instant.now());
            tripRepo.save(trip);
            // Зачищаем поля движения — вагон пропадёт из списка поездов и карты
            wagon.setActiveTrip(null);
            wagon.setCurrentTrainNumber(null);
            wagon.setCurrentTrainIndex(null);
            wagon.setWagonPosition(null);
            wagonRepo.save(wagon);
            log.debug("Trip {} archived: wagon={} op={} station={} rem={}",
                    trip.getId(), payload.getWagonNumber(),
                    payload.getOperationCode(), payload.getStationCode(),
                    payload.getRemainingDistance());
        }
    }

    public void process(DislocationRecord record) {
        process(toPayload(record));
    }

    private DislocationWebhookPayload toPayload(DislocationRecord r) {
        DislocationWebhookPayload p = new DislocationWebhookPayload();
        p.setRzdId(r.getId());
        p.setWagonNumber(r.getWagonNumber());
        p.setWaybillNumber(r.getWaybillNumber());
        p.setWagonType(r.getWagonType());
        p.setFlightStartDate(r.getFlightStartDate() != null ? r.getFlightStartDate().toInstant(ZoneOffset.UTC) : null);
        p.setFlightStartStationCode(r.getFlightStartStationCode());
        p.setFlightEndDate(r.getFlightEndDate() != null ? r.getFlightEndDate().toInstant(ZoneOffset.UTC) : null);
        p.setDestinationStationCode(r.getDestinationStationCode());
        p.setSendingNumber(r.getSendingNumber());
        p.setStationCode(r.getStationCode());
        p.setOperationCode(r.getOperationCode());
        p.setOperationDatetime(r.getOperationDatetime() != null ? r.getOperationDatetime().toInstant(ZoneOffset.UTC) : null);
        p.setTrainNumber(r.getTrainNumber());
        p.setTrainIndex(r.getTrainIndex());
        p.setWagonPosition(r.getWagonPositionInt());
        p.setRemainingDistance(r.getRemainingDistance());
        p.setRemainingMileage(r.getRemainingMileage());
        p.setDistanceTraveled(r.getDistanceTraveled());
        p.setTotalDistance(r.getTotalDistance());
        p.setGngCode(r.getGngCode());
        p.setCargoWeight(r.getCargoWeightInt());
        p.setShipperCode(r.getShipperCode());
        p.setShipperOkpo(r.getShipperOkpo());
        p.setConsigneeCode(r.getConsigneeCode());
        p.setConsigneeOkpo(r.getConsigneeOkpo());
        p.setDateDepartureFromSender(r.getDateDepartureFromSender() != null ? r.getDateDepartureFromSender().toInstant(ZoneOffset.UTC) : null);
        p.setDateArrivalAtDestination(r.getDateArrivalAtDestination() != null ? r.getDateArrivalAtDestination().toInstant(ZoneOffset.UTC) : null);
        p.setNumberLoadedContainers(r.getNumberLoadedContainers());
        p.setNumberEmptyContainers(r.getNumberEmptyContainers());
        p.setNumberOfSeals(r.getNumberOfSeals());
        List<String> containers = r.getContainerNumbers();
        p.setCn1(containers.size() > 0  ? containers.get(0)  : null);
        p.setCn2(containers.size() > 1  ? containers.get(1)  : null);
        p.setCn3(containers.size() > 2  ? containers.get(2)  : null);
        p.setCn4(containers.size() > 3  ? containers.get(3)  : null);
        p.setCn5(containers.size() > 4  ? containers.get(4)  : null);
        p.setCn6(containers.size() > 5  ? containers.get(5)  : null);
        p.setCn7(containers.size() > 6  ? containers.get(6)  : null);
        p.setCn8(containers.size() > 7  ? containers.get(7)  : null);
        p.setCn9(containers.size() > 8  ? containers.get(8)  : null);
        p.setCn10(containers.size() > 9  ? containers.get(9)  : null);
        p.setCn11(containers.size() > 10 ? containers.get(10) : null);
        p.setCn12(containers.size() > 11 ? containers.get(11) : null);
        return p;
    }

    /**
     * Полный набор условий архивации рейса (порт из Python sync_service_v2).
     *
     * Условие 1: операция 96 (прибытие груза)
     * Условие 2: операция 85 (пограничный переход)
     * Условие 3: вагон на станции Забайкальск 628406
     * Условие 4-5: остаток пути = 0 при операциях 20, 43, 58, 81
     * Условие 6: отправка с нашей станции (648400) на другое назначение при rem=0
     */
    private boolean shouldArchive(DislocationWebhookPayload p, WagonTrip trip) {
        String op      = p.getOperationCode();
        String station = p.getStationCode();
        String dest    = p.getDestinationStationCode();
        Integer rem    = p.getRemainingDistance();

        if ("96".equals(op)) return true;
        if ("85".equals(op)) return true;
        if (ZABAIKALSK.equals(station)) return true;
        if (rem != null && rem <= 0 && ARCHIVE_ON_ZERO_REM.contains(op)) return true;
        if (rem != null && rem <= 0
                && "648400".equals(trip.getDepStationCode())
                && !Objects.equals("648400", dest)) return true;

        return false;
    }

    /**
     * При создании нового рейса закрываем все другие активные рейсы этого вагона.
     * У вагона не может быть более одного активного рейса.
     */
    private void closeStaleTrips(Wagon wagon, WagonTrip currentTrip) {
        List<WagonTrip> stale = tripRepo.findOtherActiveTrips(wagon.getId(), currentTrip.getId());
        if (stale.isEmpty()) return;
        Instant now = Instant.now();
        for (WagonTrip old : stale) {
            old.setStatus(TripStatus.COMPLETED);
            old.setFinishedAt(now);
            tripRepo.save(old);
        }
        log.info("Closed {} stale trip(s) for wagon {} after new trip created",
                stale.size(), wagon.getWagonNumber());
    }

    private WagonTrip findOrCreateTrip(Wagon wagon, DislocationWebhookPayload p, boolean[] created) {
        if (p.getFlightStartDate() == null || p.getFlightStartStationCode() == null) {
            created[0] = true;
            return createNewTrip(wagon, p);
        }

        // Бизнес-дата в МСК (UTC+3), как в Python-версии
        LocalDate flightDateMsk = p.getFlightStartDate().atZone(MSK).toLocalDate();
        Instant startOfMskDay   = flightDateMsk.atStartOfDay(MSK).toInstant();
        Instant startOfNextMskDay = flightDateMsk.plusDays(1).atStartOfDay(MSK).toInstant();

        return tripRepo.findActiveTrip(
                wagon.getId(),
                p.getFlightStartStationCode(),
                startOfMskDay,
                startOfNextMskDay,
                TripStatus.ACTIVE
        ).orElseGet(() -> {
            created[0] = true;
            return createNewTrip(wagon, p);
        });
    }

    private WagonTrip createNewTrip(Wagon wagon, DislocationWebhookPayload p) {
        WagonTrip trip = WagonTrip.builder()
                .wagon(wagon)
                .depStationCode(p.getFlightStartStationCode())
                .dstStationCode(p.getDestinationStationCode())
                .startedAt(p.getFlightStartDate() != null ? p.getFlightStartDate() : Instant.now())
                .status(TripStatus.ACTIVE)
                .build();
        trip = tripRepo.save(trip);
        wagon.setActiveTrip(trip);
        wagonRepo.save(wagon);
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
        wagon.setWagonType(p.getWagonType());
        wagon.setWaybillNumber(p.getWaybillNumber());
        wagon.setSendingNumber(p.getSendingNumber());
        wagon.setWagonPosition(p.getWagonPosition());
        wagon.setDistanceTraveled(p.getDistanceTraveled());
        wagon.setTotalDistance(p.getTotalDistance());
        wagon.setRemainingMileage(p.getRemainingMileage());
        wagon.setGngCode(p.getGngCode());
        wagon.setNumberLoadedContainers(p.getNumberLoadedContainers());
        wagon.setNumberEmptyContainers(p.getNumberEmptyContainers());
        wagon.setFlightStartDate(p.getFlightStartDate());
        wagon.setFlightStartStationCode(p.getFlightStartStationCode());
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
