package ru.alabuga.dislocation.service;

import com.querydsl.core.types.Predicate;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.trip.TripDto;
import ru.alabuga.dislocation.dto.trip.TripEventDto;
import ru.alabuga.dislocation.dto.trip.TripPageRequest;
import ru.alabuga.dislocation.model.DislocationEvent;
import ru.alabuga.dislocation.model.RailwayStation;
import ru.alabuga.dislocation.model.WagonTrip;
import ru.alabuga.dislocation.predicate.WagonTripPredicate;
import ru.alabuga.dislocation.repository.DislocationEventRepository;
import ru.alabuga.dislocation.repository.RailwayStationRepository;
import ru.alabuga.dislocation.repository.WagonTripRepository;
import ru.alabuga.dislocation.util.OperationCodeUtil;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TripService {

    private final WagonTripRepository tripRepo;
    private final DislocationEventRepository eventRepo;
    private final RailwayStationRepository stationRepo;
    private final WagonTripPredicate tripPredicate;

    public Page<TripDto> getPage(TripPageRequest request) {
        Predicate predicate = tripPredicate.build(request.getFilter());
        PageRequest pageRequest = PageRequest.of(request.getPage(), request.getSize());
        return tripRepo.findAll(predicate, pageRequest).map(this::toDto);
    }

    public TripDto getById(UUID id) {
        return tripRepo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found: " + id));
    }

    public List<TripEventDto> getEvents(UUID tripId) {
        List<DislocationEvent> events = eventRepo.findByTripIdOrdered(tripId);

        Set<String> codes = events.stream()
                .map(DislocationEvent::getStationCode)
                .filter(c -> c != null)
                .collect(Collectors.toSet());
        Map<String, String> stationNames = stationRepo.findAllById(codes).stream()
                .collect(Collectors.toMap(RailwayStation::getCode, RailwayStation::getName));

        return events.stream()
                .map(e -> toEventDto(e, stationNames))
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

    private TripEventDto toEventDto(DislocationEvent e, Map<String, String> stationNames) {
        return TripEventDto.builder()
                .id(e.getId())
                .stationCode(e.getStationCode())
                .stationName(e.getStationCode() != null ? stationNames.get(e.getStationCode()) : null)
                .operationCode(e.getOperationCode())
                .operationName(OperationCodeUtil.getName(e.getOperationCode()))
                .operationDatetime(e.getOperationDatetime())
                .remainingDistance(e.getRemainingDistance())
                .trainNumber(e.getTrainNumber())
                .containerNumbers(e.getContainerNumbers())
                .build();
    }
}
