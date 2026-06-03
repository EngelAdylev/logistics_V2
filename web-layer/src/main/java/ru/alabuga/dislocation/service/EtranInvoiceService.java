package ru.alabuga.dislocation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.invoice.EtranInvoiceDto;
import ru.alabuga.dislocation.dto.invoice.EtranInvoiceWebhookDto;
import ru.alabuga.dislocation.model.EtranInvoice;
import ru.alabuga.dislocation.repository.EtranInvoiceRepository;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EtranInvoiceService {

    private final EtranInvoiceRepository invoiceRepo;
    private final ObjectMapper objectMapper;

    @Transactional
    public EtranInvoiceDto sync(EtranInvoiceWebhookDto payload) {
        EtranInvoiceWebhookDto.Waybill w = payload.getWaybill();
        if (w == null || w.getWaybillNumber() == null || w.getWaybillNumber().isBlank()) {
            throw new IllegalArgumentException("waybill.waybill_number is required");
        }

        EtranInvoice invoice = invoiceRepo.findByWaybillNumber(w.getWaybillNumber())
                .orElseGet(EtranInvoice::new);

        invoice.setWaybillNumber(w.getWaybillNumber());
        invoice.setWaybillIdentifier(w.getWaybillIdentifier());
        invoice.setWaybillStatus(w.getWaybillStatus());
        invoice.setWaybillType(w.getWaybillType());
        invoice.setShipmentType(w.getShipmentType());
        invoice.setShipmentSpeed(w.getShipmentSpeed());
        invoice.setDeliveryDeadline(toInstant(w.getDeliveryDeadline()));
        invoice.setWaybillCreatedAt(toInstant(w.getWaybillCreatedAt()));
        invoice.setDepartureStation(w.getDepartureStation());
        invoice.setDepartureStationCode(w.getDepartureStationCode());
        invoice.setDepartureCountry(w.getDepartureCountry());
        invoice.setDestinationStation(w.getDestinationStation());
        invoice.setDestinationStationCode(w.getDestinationStationCode());
        invoice.setDestinationCountry(w.getDestinationCountry());
        invoice.setShipperName(w.getShipperName());
        invoice.setShipperOkpo(w.getShipperOkpo());
        invoice.setConsigneeName(w.getConsigneeName());
        invoice.setConsigneeOkpo(w.getConsigneeOkpo());
        invoice.setPayer(w.getPayer());
        invoice.setResponsiblePerson(w.getResponsiblePerson());

        if (w.getProducts() != null && !w.getProducts().isEmpty()) {
            EtranInvoiceWebhookDto.WaybillProduct p = w.getProducts().get(0);
            invoice.setEtsngCode(p.getEtsngCode());
            invoice.setEtsngName(p.getEtsngName());
            invoice.setGngCode(p.getGngCode());
            invoice.setCargoWeight(p.getCargoWeight());
            invoice.setCargoFullName(p.getCargoFullName());
        }

        try {
            invoice.setRawJson(objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize raw_json for waybill {}", w.getWaybillNumber());
        }

        invoice = invoiceRepo.save(invoice);
        log.info("Upserted etran_invoice waybill={} status={}", invoice.getWaybillNumber(), invoice.getWaybillStatus());
        return toDto(invoice);
    }

    @Transactional(readOnly = true)
    public List<EtranInvoiceDto> getAll() {
        return invoiceRepo.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public Optional<EtranInvoiceDto> getByWaybillNumber(String waybillNumber) {
        return invoiceRepo.findByWaybillNumber(waybillNumber).map(this::toDto);
    }

    private static java.time.Instant toInstant(LocalDateTime ldt) {
        return ldt != null ? ldt.toInstant(ZoneOffset.UTC) : null;
    }

    private EtranInvoiceDto toDto(EtranInvoice i) {
        return EtranInvoiceDto.builder()
                .id(i.getId())
                .waybillNumber(i.getWaybillNumber())
                .waybillStatus(i.getWaybillStatus())
                .waybillType(i.getWaybillType())
                .shipmentType(i.getShipmentType())
                .shipmentSpeed(i.getShipmentSpeed())
                .deliveryDeadline(i.getDeliveryDeadline())
                .waybillCreatedAt(i.getWaybillCreatedAt())
                .departureStation(i.getDepartureStation())
                .departureStationCode(i.getDepartureStationCode())
                .departureCountry(i.getDepartureCountry())
                .destinationStation(i.getDestinationStation())
                .destinationStationCode(i.getDestinationStationCode())
                .destinationCountry(i.getDestinationCountry())
                .shipperName(i.getShipperName())
                .shipperOkpo(i.getShipperOkpo())
                .consigneeName(i.getConsigneeName())
                .consigneeOkpo(i.getConsigneeOkpo())
                .payer(i.getPayer())
                .responsiblePerson(i.getResponsiblePerson())
                .etsngCode(i.getEtsngCode())
                .etsngName(i.getEtsngName())
                .gngCode(i.getGngCode())
                .cargoWeight(i.getCargoWeight())
                .cargoFullName(i.getCargoFullName())
                .receivedAt(i.getReceivedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }
}
