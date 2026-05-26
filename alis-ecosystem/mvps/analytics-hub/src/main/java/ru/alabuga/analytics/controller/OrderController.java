package ru.alabuga.analytics.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.analytics.dto.orders.OrderSummaryDto;
import ru.alabuga.analytics.dto.orders.StuckOrderDto;
import ru.alabuga.analytics.service.OrderService;

import java.util.List;

@Tag(name = "orders")
@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "Сводка по статусам заказов")
    @GetMapping("/summary")
    public List<OrderSummaryDto> getSummary() {
        return orderService.getSummary();
    }

    @Operation(summary = "Зависшие заказы (IN_PROGRESS > 4 часов)")
    @GetMapping("/stuck")
    public List<StuckOrderDto> getStuck(
            @RequestParam(defaultValue = "ALL") String type) {
        return orderService.getStuck(type);
    }
}
