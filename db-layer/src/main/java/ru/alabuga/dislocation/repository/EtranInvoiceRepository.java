package ru.alabuga.dislocation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.alabuga.dislocation.model.EtranInvoice;

import java.util.Optional;
import java.util.UUID;

public interface EtranInvoiceRepository extends JpaRepository<EtranInvoice, UUID> {
    Optional<EtranInvoice> findByWaybillNumber(String waybillNumber);
}
