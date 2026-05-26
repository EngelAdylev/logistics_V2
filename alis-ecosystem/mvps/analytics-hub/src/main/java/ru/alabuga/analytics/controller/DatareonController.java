package ru.alabuga.analytics.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.analytics.dto.datareon.EventDto;
import ru.alabuga.analytics.dto.datareon.EventFilterRequest;
import ru.alabuga.analytics.dto.datareon.SummaryDto;
import ru.alabuga.analytics.service.DatareonService;

import java.util.List;

@Tag(name = "datareon")
@RestController
@RequestMapping("/datareon")
@RequiredArgsConstructor
public class DatareonController {

    private final DatareonService datareonService;

    @Operation(summary = "Счётчики пакетов за период")
    @GetMapping("/summary")
    public SummaryDto getSummary(@RequestParam(defaultValue = "1h") String period) {
        return datareonService.getSummary(period);
    }

    @Operation(summary = "Список событий с фильтрацией")
    @GetMapping("/events")
    public List<EventDto> getEvents(
            @RequestParam(defaultValue = "1h") String period,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "ALL") String system,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return datareonService.getEvents(new EventFilterRequest(period, status, system, page, size));
    }
}
