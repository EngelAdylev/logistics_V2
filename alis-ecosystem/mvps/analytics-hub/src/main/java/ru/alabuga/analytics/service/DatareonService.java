package ru.alabuga.analytics.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.analytics.dto.datareon.EventDto;
import ru.alabuga.analytics.dto.datareon.EventFilterRequest;
import ru.alabuga.analytics.dto.datareon.SummaryDto;
import ru.alabuga.analytics.model.InboundEvent;
import ru.alabuga.analytics.model.OutboundData;
import ru.alabuga.analytics.repository.InboundEventRepository;
import ru.alabuga.analytics.repository.OutboundDataRepository;
import ru.alabuga.analytics.util.SystemMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DatareonService {

    private final InboundEventRepository inboundEventRepository;
    private final OutboundDataRepository outboundDataRepository;

    public SummaryDto getSummary(String period) {
        LocalDateTime since = sinceByPeriod(period);
        LocalDateTime stuckThreshold = LocalDateTime.now().minusMinutes(15);

        long inboundTotal = inboundEventRepository.countByCreatedAtAfter(since);
        long inboundSuccess = inboundEventRepository.countByStatusAndCreatedAtAfter("DONE", since);
        long inboundErrors = inboundEventRepository.countErrors(since);
        long inboundStuck = inboundEventRepository.countStuck(stuckThreshold);

        long outboundTotal = outboundDataRepository.countByCreatedAtAfter(since);
        long outboundSuccess = outboundDataRepository.countBySuccessTrueAndCreatedAtAfter(since);
        long outboundErrors = outboundDataRepository.countBySuccessFalseAndCreatedAtAfter(since);
        long outboundStuck = outboundDataRepository.countStuck(stuckThreshold);

        return new SummaryDto(
            inboundTotal + outboundTotal,
            inboundSuccess + outboundSuccess,
            inboundErrors + outboundErrors,
            inboundStuck + outboundStuck
        );
    }

    public List<EventDto> getEvents(EventFilterRequest filter) {
        LocalDateTime since = sinceByPeriod(filter.period());
        LocalDateTime stuckThreshold = LocalDateTime.now().minusMinutes(15);
        PageRequest pageable = PageRequest.of(filter.page(), filter.size());

        List<EventDto> events = new ArrayList<>();

        if ("STUCK".equals(filter.status())) {
            inboundEventRepository.findStuck(stuckThreshold, pageable)
                .forEach(e -> events.add(toInboundDto(e, stuckThreshold)));
            outboundDataRepository.findStuck(stuckThreshold, pageable)
                .forEach(d -> events.add(toOutboundDto(d, stuckThreshold)));
        } else if ("ERROR".equals(filter.status())) {
            inboundEventRepository.findErrors(since, pageable)
                .forEach(e -> events.add(toInboundDto(e, stuckThreshold)));
            outboundDataRepository.findErrors(since, pageable)
                .forEach(d -> events.add(toOutboundDto(d, stuckThreshold)));
        } else {
            inboundEventRepository.findByCreatedAtAfterOrderByCreatedAtDesc(since, pageable)
                .forEach(e -> events.add(toInboundDto(e, stuckThreshold)));
            outboundDataRepository.findByCreatedAtAfterOrderByCreatedAtDesc(since, pageable)
                .forEach(d -> events.add(toOutboundDto(d, stuckThreshold)));
        }

        return events.stream()
            .filter(e -> "ALL".equals(filter.system()) || filter.system().equals(e.system()))
            .sorted(Comparator.comparing(EventDto::time).reversed())
            .limit(filter.size())
            .toList();
    }

    private EventDto toInboundDto(InboundEvent e, LocalDateTime stuckThreshold) {
        return new EventDto(
            e.getId().toString(),
            e.getCreatedAt(),
            "INBOUND",
            SystemMapper.fromEventCode(e.getEventCode()),
            e.getEventName() != null ? e.getEventName() : e.getEventCode(),
            resolveInboundStatus(e, stuckThreshold),
            e.getStatusDetails()
        );
    }

    private EventDto toOutboundDto(OutboundData d, LocalDateTime stuckThreshold) {
        return new EventDto(
            d.getId().toString(),
            d.getCreatedAt(),
            "OUTBOUND",
            SystemMapper.fromMessageType(d.getMessageType()),
            d.getMessageType(),
            resolveOutboundStatus(d, stuckThreshold),
            d.getErrorMessage()
        );
    }

    private String resolveInboundStatus(InboundEvent e, LocalDateTime stuckThreshold) {
        if ("DONE".equals(e.getStatus())) return "Успешно";
        if ("FAILED".equals(e.getStatus()) || "INVALID".equals(e.getStatus())) return "Ошибка";
        if (e.getCreatedAt().isBefore(stuckThreshold)) return "Завис";
        return "В обработке";
    }

    private String resolveOutboundStatus(OutboundData d, LocalDateTime stuckThreshold) {
        if (Boolean.TRUE.equals(d.getSuccess())) return "Успешно";
        if (Boolean.FALSE.equals(d.getSuccess())) return "Ошибка";
        if (d.getCreatedAt().isBefore(stuckThreshold)) return "Завис";
        return "В обработке";
    }

    private LocalDateTime sinceByPeriod(String period) {
        return switch (period) {
            case "6h" -> LocalDateTime.now().minusHours(6);
            case "24h" -> LocalDateTime.now().minusHours(24);
            default -> LocalDateTime.now().minusHours(1);
        };
    }
}
