package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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

    @Value("${webhook.secret:}")
    private String webhookSecret;

    @Operation(summary = "Приём пакета дислокации от РЖД")
    @PostMapping("/dislocation")
    public ResponseEntity<Void> receiveDislocation(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String secret,
            @Valid @RequestBody DislocationWebhookPayload payload) {
        if (!webhookSecret.isBlank() && !webhookSecret.equals(secret)) {
            log.warn("Rejected webhook request: invalid or missing X-Webhook-Secret");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        log.debug("Received dislocation event: rzdId={}, wagon={}",
                payload.getRzdId(), payload.getWagonNumber());
        processingService.process(payload);
        return ResponseEntity.ok().build();
    }
}
