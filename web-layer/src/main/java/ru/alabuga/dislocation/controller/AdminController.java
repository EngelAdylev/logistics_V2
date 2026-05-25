package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.alabuga.dislocation.model.TripStatus;

import com.opencsv.exceptions.CsvValidationException;

import java.io.IOException;
import ru.alabuga.dislocation.repository.DislocationEventRepository;
import ru.alabuga.dislocation.repository.WagonRepository;
import ru.alabuga.dislocation.repository.WagonTripRepository;
import ru.alabuga.dislocation.service.StationService;

import java.util.Map;

@Tag(name = "admin")
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final StationService stationService;
    private final WagonRepository wagonRepo;
    private final WagonTripRepository tripRepo;
    private final DislocationEventRepository eventRepo;

    @Operation(summary = "Загрузить справочник станций из CSV (формат: code,name,lat,lng)")
    @PostMapping(value = "/sync-stations", consumes = "multipart/form-data")
    public Map<String, Object> syncStations(@RequestParam("file") MultipartFile file) throws IOException, CsvValidationException {
        int count = stationService.syncFromCsv(file);
        return Map.of("imported", count);
    }

    @Operation(summary = "Статистика системы")
    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return Map.of(
                "wagons", wagonRepo.count(),
                "activeTrips", tripRepo.countByStatus(TripStatus.ACTIVE),
                "events", eventRepo.count()
        );
    }
}
