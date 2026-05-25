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
