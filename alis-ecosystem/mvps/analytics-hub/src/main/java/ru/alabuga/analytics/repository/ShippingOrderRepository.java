package ru.alabuga.analytics.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.alabuga.analytics.model.ShippingOrder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ShippingOrderRepository extends JpaRepository<ShippingOrder, UUID> {

    long countByOrderStatus(String orderStatus);

    @Query("SELECT o FROM ShippingOrder o WHERE o.orderStatus = 'IN_PROGRESS' AND o.updatedAt < :threshold ORDER BY o.updatedAt ASC")
    List<ShippingOrder> findStuck(LocalDateTime threshold);
}
