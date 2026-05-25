package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.StationDto;
import ru.alabuga.dislocation.service.StationService;

import java.util.List;

@Tag(name = "stations")
@RestController
@RequestMapping("/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @Operation(summary = "Справочник станций")
    @GetMapping
    public List<StationDto> getAll() {
        return stationService.getAll();
    }

    @Operation(summary = "Станция по коду РЖД")
    @GetMapping("/{code}")
    public StationDto getByCode(@PathVariable String code) {
        return stationService.getByCode(code);
    }
}
