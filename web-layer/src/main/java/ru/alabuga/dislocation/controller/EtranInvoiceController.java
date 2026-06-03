package ru.alabuga.dislocation.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.invoice.EtranInvoiceDto;
import ru.alabuga.dislocation.dto.invoice.EtranInvoiceWebhookDto;
import ru.alabuga.dislocation.service.EtranInvoiceService;

import java.util.List;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class EtranInvoiceController {

    private final EtranInvoiceService invoiceService;

    @PostMapping("/sync")
    public ResponseEntity<EtranInvoiceDto> sync(@RequestBody EtranInvoiceWebhookDto payload) {
        return ResponseEntity.ok(invoiceService.sync(payload));
    }

    @GetMapping
    public List<EtranInvoiceDto> getAll() {
        return invoiceService.getAll();
    }

    @GetMapping("/{waybillNumber}")
    public ResponseEntity<EtranInvoiceDto> getOne(@PathVariable String waybillNumber) {
        return invoiceService.getByWaybillNumber(waybillNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
