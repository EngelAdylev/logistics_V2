package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.train.TrainSummaryDto;
import ru.alabuga.dislocation.dto.wagon.WagonDto;
import ru.alabuga.dislocation.service.TrainService;

import java.util.List;

@Tag(name = "trains")
@RestController
@RequestMapping("/trains")
@RequiredArgsConstructor
public class TrainController {

    private final TrainService trainService;

    @Operation(summary = "Список поездов с краткой сводкой")
    @GetMapping
    public List<TrainSummaryDto> getTrains() {
        return trainService.getTrains();
    }

    @Operation(summary = "Вагоны в поезде")
    @GetMapping("/{trainNumber}/wagons")
    public List<WagonDto> getWagons(
            @PathVariable String trainNumber,
            @RequestParam(required = false) String trainIndex) {
        return trainService.getWagons(trainNumber, trainIndex);
    }
}
