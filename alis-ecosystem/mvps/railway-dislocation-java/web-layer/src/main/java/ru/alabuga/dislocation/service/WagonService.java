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

import jakarta.persistence.EntityNotFoundException;
import ru.alabuga.dislocation.model.RailwayStation;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
                .orElseThrow(() -> new EntityNotFoundException("Wagon not found: " + id));
    }

    public List<WagonMapDto> getForMap() {
        List<Wagon> wagons = wagonRepo.findAllWithStation();

        Set<String> stationCodes = wagons.stream()
                .map(Wagon::getStationCode)
                .collect(Collectors.toSet());

        Map<String, RailwayStation> stationMap = stationRepo.findAllById(stationCodes).stream()
                .collect(Collectors.toMap(RailwayStation::getCode, s -> s));

        return wagons.stream()
                .map(w -> {
                    RailwayStation s = stationMap.get(w.getStationCode());
                    if (s == null) return null;
                    return WagonMapDto.builder()
                            .id(w.getId())
                            .wagonNumber(w.getWagonNumber())
                            .remainingDistance(w.getRemainingDistance())
                            .operationCode(w.getOperationCode())
                            .trainNumber(w.getCurrentTrainNumber())
                            .destinationStationCode(w.getDestinationStationCode())
                            .lat(s.getLat())
                            .lng(s.getLng())
                            .build();
                })
                .filter(Objects::nonNull)
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
