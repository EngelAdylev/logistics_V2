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
import java.util.Objects;

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
                && Objects.equals(payload.getStationCode(), trip.getDstStationCode())
                && trip.getDstStationCode() != null) {
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
        Instant startOfDay = flightDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant startOfNextDay = flightDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        return tripRepo.findActiveTrip(
                wagon.getId(),
                p.getFlightStartStationCode(),
                startOfDay,
                startOfNextDay,
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
