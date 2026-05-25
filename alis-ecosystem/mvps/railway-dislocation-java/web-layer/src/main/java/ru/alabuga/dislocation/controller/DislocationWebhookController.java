package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.webhook.DislocationWebhookPayload;
import ru.alabuga.dislocation.service.DislocationProcessingService;

@Tag(name = "webhook")
@RestController
@RequestMapping("/webhook")
@RequiredArgsConstructor
@Slf4j
public class DislocationWebhookController {

    private final DislocationProcessingService processingService;

    @Operation(summary = "Приём пакета дислокации от РЖД")
    @PostMapping("/dislocation")
    public ResponseEntity<Void> receiveDislocation(
            @RequestBody DislocationWebhookPayload payload) {
        log.debug("Received dislocation event: rzdId={}, wagon={}",
                payload.getRzdId(), payload.getWagonNumber());
        processingService.process(payload);
        return ResponseEntity.ok().build();
    }
}
