package ru.alabuga.analytics.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.alabuga.analytics.dto.datareon.SummaryDto;
import ru.alabuga.analytics.repository.InboundEventRepository;
import ru.alabuga.analytics.repository.OutboundDataRepository;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatareonServiceTest {

    @Mock
    InboundEventRepository inboundEventRepository;

    @Mock
    OutboundDataRepository outboundDataRepository;

    @InjectMocks
    DatareonService datareonService;

    @Test
    void summary_combines_inbound_and_outbound_counts() {
        when(inboundEventRepository.countByCreatedAtAfter(any())).thenReturn(10L);
        when(inboundEventRepository.countByStatusAndCreatedAtAfter(any(), any())).thenReturn(8L);
        when(inboundEventRepository.countStuck(any())).thenReturn(1L);

        when(outboundDataRepository.countByCreatedAtAfter(any())).thenReturn(20L);
        when(outboundDataRepository.countBySuccessTrueAndCreatedAtAfter(any())).thenReturn(18L);
        when(outboundDataRepository.countBySuccessFalseAndCreatedAtAfter(any())).thenReturn(1L);
        when(outboundDataRepository.countStuck(any())).thenReturn(1L);

        SummaryDto result = datareonService.getSummary("1h");

        assertThat(result.total()).isEqualTo(30L);
        assertThat(result.success()).isEqualTo(26L);
        assertThat(result.errors()).isEqualTo(1L);
        assertThat(result.stuck()).isEqualTo(2L);
    }
}
