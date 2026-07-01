package ru.alabuga.dislocation.service;

import com.querydsl.core.types.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.wagon.WagonDto;
import ru.alabuga.dislocation.dto.wagon.WagonMapDto;
import ru.alabuga.dislocation.dto.wagon.WagonPageRequest;
import ru.alabuga.dislocation.model.RailwayStation;
import ru.alabuga.dislocation.model.Wagon;
import ru.alabuga.dislocation.predicate.WagonPredicate;
import ru.alabuga.dislocation.repository.RailwayStationRepository;
import ru.alabuga.dislocation.repository.WagonRepository;

import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.Map;
import ru.alabuga.dislocation.util.OperationCodeUtil;
import java.math.BigDecimal;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WagonService {

    private static final String OUR_STATION     = "648400";
    private static final BigDecimal OUR_STATION_LAT = new BigDecimal("55.58547");
    private static final BigDecimal OUR_STATION_LNG = new BigDecimal("52.08021");

    private final WagonRepository wagonRepo;
    private final RailwayStationRepository stationRepo;
    private final WagonPredicate wagonPredicate;

    public Page<WagonDto> getPage(WagonPageRequest request) {
        Predicate predicate = wagonPredicate.build(request.getFilter());
        PageRequest pageRequest = PageRequest.of(request.getPage(), request.getSize());
        Page<Wagon> page = wagonRepo.findAll(predicate, pageRequest);

        // Названия станций подтягиваем из справочника (в самом вагоне хранится только код)
        Map<String, String> stationNames = resolveStationNames(page.getContent().stream()
                .flatMap(w -> Stream.of(w.getStationCode(), w.getFlightStartStationCode(), w.getDestinationStationCode()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));

        return page.map(w -> toDto(w, stationNames));
    }

    public WagonDto getById(UUID id) {
        return wagonRepo.findById(id)
                .map(w -> toDto(w, Map.of()))
                .orElseThrow(() -> new EntityNotFoundException("Wagon not found: " + id));
    }

    public List<WagonDto> getByTrain(String trainNumber, String trainIndex) {
        List<Wagon> wagons = trainIndex != null
                ? wagonRepo.findByCurrentTrainNumberAndCurrentTrainIndexOrderByWagonPositionAsc(trainNumber, trainIndex)
                : wagonRepo.findByCurrentTrainNumberAndCurrentTrainIndexIsNullOrderByWagonPositionAsc(trainNumber);

        Map<String, String> stationNames = resolveStationNames(wagons.stream()
                .flatMap(w -> Stream.of(w.getStationCode(), w.getFlightStartStationCode(), w.getDestinationStationCode()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));

        return wagons.stream().map(w -> toDto(w, stationNames)).toList();
    }

    public List<WagonMapDto> getForMap() {
        List<Wagon> wagons = wagonRepo.findAllWithStation();

        Set<String> stationCodes = wagons.stream()
                .map(Wagon::getStationCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, RailwayStation> stationMap = stationRepo.findAllById(stationCodes).stream()
                .collect(Collectors.toMap(RailwayStation::getCode, s -> s));

        return wagons.stream()
                .map(w -> {
                    RailwayStation s = stationMap.get(w.getStationCode());
                    if (s == null) {
                        log.warn("Wagon {} at unknown stationCode={} — skipping from map",
                                w.getWagonNumber(), w.getStationCode());
                        return null;
                    }
                    boolean atOurStation = OUR_STATION.equals(w.getStationCode())
                            && OUR_STATION.equals(w.getDestinationStationCode())
                            && "20".equals(w.getOperationCode());

                    return WagonMapDto.builder()
                            .id(w.getId())
                            .wagonNumber(w.getWagonNumber())
                            .stationCode(s.getCode())
                            .stationName(atOurStation ? "КРУГЛОЕ ПОЛЕ" : s.getName())
                            .lat(atOurStation ? OUR_STATION_LAT : s.getLat())
                            .lng(atOurStation ? OUR_STATION_LNG : s.getLng())
                            .remainingDistance(w.getRemainingDistance())
                            .operationCode(w.getOperationCode())
                            .trainNumber(w.getCurrentTrainNumber())
                            .trainIndex(w.getCurrentTrainIndex())
                            .destinationStationCode(w.getDestinationStationCode())
                            .activeTripId(w.getActiveTrip() != null ? w.getActiveTrip().getId() : null)
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private Map<String, String> resolveStationNames(Set<String> codes) {
        if (codes.isEmpty()) return Map.of();
        return stationRepo.findAllById(codes).stream()
                .collect(Collectors.toMap(RailwayStation::getCode, RailwayStation::getName));
    }

    private WagonDto toDto(Wagon w, Map<String, String> stationNames) {
        return WagonDto.builder()
                .id(w.getId())
                .wagonNumber(w.getWagonNumber())
                .wagonType(w.getWagonType())
                .stationCode(w.getStationCode())
                .stationName(w.getStationName() != null ? w.getStationName()
                        : stationNames.getOrDefault(w.getStationCode(), null))
                .currentTrainNumber(w.getCurrentTrainNumber())
                .currentTrainIndex(w.getCurrentTrainIndex())
                .wagonPosition(w.getWagonPosition())
                .remainingDistance(w.getRemainingDistance())
                .distanceTraveled(w.getDistanceTraveled())
                .totalDistance(w.getTotalDistance())
                .operationCode(w.getOperationCode())
                .operationName(OperationCodeUtil.getName(w.getOperationCode()))
                .lastSeenAt(w.getLastSeenAt())
                .flightStartStationCode(w.getFlightStartStationCode())
                .flightStartStationName(stationNames.getOrDefault(w.getFlightStartStationCode(), null))
                .flightStartDate(w.getFlightStartDate())
                .destinationStationCode(w.getDestinationStationCode())
                .destinationStationName(stationNames.getOrDefault(w.getDestinationStationCode(), null))
                .waybillNumber(w.getWaybillNumber())
                .sendingNumber(w.getSendingNumber())
                .gngCode(w.getGngCode())
                .shipperOkpo(w.getShipperOkpo())
                .consigneeOkpo(w.getConsigneeOkpo())
                .containerNumbers(w.getContainerNumbers())
                .numberLoadedContainers(w.getNumberLoadedContainers())
                .numberEmptyContainers(w.getNumberEmptyContainers())
                .cargoWeight(w.getCargoWeight())
                .dateArrivalAtDestination(w.getDateArrivalAtDestination())
                .activeTripId(w.getActiveTrip() != null ? w.getActiveTrip().getId() : null)
                .build();
    }
}
