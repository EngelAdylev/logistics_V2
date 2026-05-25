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
                .orElseThrow(() -> new EntityNotFoundException("Trip not found: " + id));
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
