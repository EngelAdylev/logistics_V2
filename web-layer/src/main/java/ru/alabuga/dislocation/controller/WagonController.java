package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.wagon.WagonDto;
import ru.alabuga.dislocation.dto.wagon.WagonMapDto;
import ru.alabuga.dislocation.dto.wagon.WagonPageRequest;
import ru.alabuga.dislocation.service.WagonService;

import java.util.List;
import java.util.UUID;

@Tag(name = "wagons")
@RestController
@RequestMapping("/wagons")
@RequiredArgsConstructor
public class WagonController {

    private final WagonService wagonService;

    @Operation(summary = "Список вагонов с фильтрами и пагинацией")
    @PostMapping("/page")
    public Page<WagonDto> getPage(@RequestBody WagonPageRequest request) {
        return wagonService.getPage(request);
    }

    @Operation(summary = "Вагон по ID")
    @GetMapping("/{id}")
    public WagonDto getById(@PathVariable UUID id) {
        return wagonService.getById(id);
    }

    @Operation(summary = "Все вагоны для карты (лёгкий формат)")
    @GetMapping("/map")
    public List<WagonMapDto> getForMap() {
        return wagonService.getForMap();
    }
}
