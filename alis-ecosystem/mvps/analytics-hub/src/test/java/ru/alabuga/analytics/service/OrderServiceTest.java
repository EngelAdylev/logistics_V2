package ru.alabuga.analytics.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.alabuga.analytics.dto.orders.StuckOrderDto;
import ru.alabuga.analytics.model.ReceivingOrder;
import ru.alabuga.analytics.repository.ReceivingOrderRepository;
import ru.alabuga.analytics.repository.ShippingOrderRepository;
import ru.alabuga.analytics.repository.ClientRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    ReceivingOrderRepository receivingOrderRepository;

    @Mock
    ShippingOrderRepository shippingOrderRepository;

    @Mock
    ClientRepository clientRepository;

    @InjectMocks
    OrderService orderService;

    @Test
    void stuck_orders_include_receiving_type() {
        ReceivingOrder receiving = new ReceivingOrder();
        setField(receiving, "id", UUID.randomUUID());
        setField(receiving, "number", 42);
        setField(receiving, "orderStatus", "IN_PROGRESS");
        setField(receiving, "clientId", UUID.randomUUID());
        setField(receiving, "updatedAt", LocalDateTime.now().minusHours(5));

        when(receivingOrderRepository.findStuck(any())).thenReturn(List.of(receiving));
        when(shippingOrderRepository.findStuck(any())).thenReturn(List.of());
        when(clientRepository.findAllById(any())).thenReturn(List.of());

        List<StuckOrderDto> stuck = orderService.getStuck("ALL");

        assertThat(stuck).hasSize(1);
        assertThat(stuck.get(0).type()).isEqualTo("RECEIVING");
        assertThat(stuck.get(0).minutesInStatus()).isGreaterThan(240);
    }

    private void setField(Object obj, String field, Object value) {
        try {
            var f = obj.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(obj, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
