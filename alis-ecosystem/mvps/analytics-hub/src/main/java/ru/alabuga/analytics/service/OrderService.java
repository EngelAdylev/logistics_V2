package ru.alabuga.analytics.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.analytics.dto.orders.OrderSummaryDto;
import ru.alabuga.analytics.dto.orders.StuckOrderDto;
import ru.alabuga.analytics.model.Client;
import ru.alabuga.analytics.model.ReceivingOrder;
import ru.alabuga.analytics.model.ShippingOrder;
import ru.alabuga.analytics.repository.ClientRepository;
import ru.alabuga.analytics.repository.ReceivingOrderRepository;
import ru.alabuga.analytics.repository.ShippingOrderRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final ReceivingOrderRepository receivingOrderRepository;
    private final ShippingOrderRepository shippingOrderRepository;
    private final ClientRepository clientRepository;

    public List<OrderSummaryDto> getSummary() {
        return List.of(
            new OrderSummaryDto(
                receivingOrderRepository.countByOrderStatus("DRAFT"),
                receivingOrderRepository.countByOrderStatus("ON_REVIEW"),
                receivingOrderRepository.countByOrderStatus("ACCEPTED"),
                receivingOrderRepository.countByOrderStatus("IN_PROGRESS"),
                receivingOrderRepository.countByOrderStatus("DONE"),
                "RECEIVING"
            ),
            new OrderSummaryDto(
                shippingOrderRepository.countByOrderStatus("DRAFT"),
                shippingOrderRepository.countByOrderStatus("ON_REVIEW"),
                shippingOrderRepository.countByOrderStatus("ACCEPTED"),
                shippingOrderRepository.countByOrderStatus("IN_PROGRESS"),
                shippingOrderRepository.countByOrderStatus("DONE"),
                "SHIPPING"
            )
        );
    }

    public List<StuckOrderDto> getStuck(String type) {
        LocalDateTime threshold = LocalDateTime.now().minusHours(4);
        Map<UUID, String> clientNames = new HashMap<>();
        List<StuckOrderDto> result = new ArrayList<>();

        if (!"SHIPPING".equals(type)) {
            List<ReceivingOrder> stuckReceiving = receivingOrderRepository.findStuck(threshold);
            collectClientNames(stuckReceiving.stream().map(ReceivingOrder::getClientId).toList(), clientNames);
            stuckReceiving.stream()
                .map(o -> toStuckDto(o.getId(), o.getNumber(), "RECEIVING", o.getOrderStatus(),
                    o.getClientId(), o.getUpdatedAt(), clientNames))
                .forEach(result::add);
        }

        if (!"RECEIVING".equals(type)) {
            List<ShippingOrder> stuckShipping = shippingOrderRepository.findStuck(threshold);
            collectClientNames(stuckShipping.stream().map(ShippingOrder::getClientId).toList(), clientNames);
            stuckShipping.stream()
                .map(o -> toStuckDto(o.getId(), o.getNumber(), "SHIPPING", o.getOrderStatus(),
                    o.getClientId(), o.getUpdatedAt(), clientNames))
                .forEach(result::add);
        }

        result.sort(Comparator.comparing(StuckOrderDto::updatedAt,
            Comparator.nullsLast(Comparator.naturalOrder())));
        return result;
    }

    private void collectClientNames(List<UUID> ids, Map<UUID, String> target) {
        clientRepository.findAllById(ids)
            .forEach(c -> target.put(c.getId(), c.getName()));
    }

    private StuckOrderDto toStuckDto(UUID id, Integer number, String type, String status,
                                     UUID clientId, LocalDateTime updatedAt, Map<UUID, String> clientNames) {
        long minutes = updatedAt != null
            ? ChronoUnit.MINUTES.between(updatedAt, LocalDateTime.now())
            : 0;
        return new StuckOrderDto(
            id.toString(), number, type, status,
            clientNames.getOrDefault(clientId, clientId != null ? clientId.toString() : "—"),
            updatedAt, minutes
        );
    }
}
