package ru.alabuga.dislocation.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import ru.alabuga.dislocation.dto.webhook.DislocationWebhookPayload;
import ru.alabuga.dislocation.model.TripStatus;
import ru.alabuga.dislocation.model.Wagon;
import ru.alabuga.dislocation.model.WagonTrip;
import ru.alabuga.dislocation.repository.DislocationEventRepository;
import ru.alabuga.dislocation.repository.WagonRepository;
import ru.alabuga.dislocation.repository.WagonTripRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DislocationProcessingServiceTest {

    @Mock DislocationEventRepository eventRepo;
    @Mock WagonRepository wagonRepo;
    @Mock WagonTripRepository tripRepo;

    @InjectMocks DislocationProcessingService service;

    @BeforeEach
    void setUp() { MockitoAnnotations.openMocks(this); }

    @Test
    void shouldIgnoreDuplicateEvent() {
        DislocationWebhookPayload payload = new DislocationWebhookPayload();
        payload.setRzdId(UUID.randomUUID());
        payload.setWagonNumber("42691234");
        payload.setOperationCode("20");
        payload.setOperationDatetime(Instant.now());

        when(eventRepo.existsByRzdId(payload.getRzdId())).thenReturn(true);

        service.process(payload);

        verify(eventRepo, never()).save(any());
        verify(wagonRepo, never()).save(any());
    }

    @Test
    void shouldCreateNewTripForNewWagon() {
        DislocationWebhookPayload payload = new DislocationWebhookPayload();
        payload.setRzdId(UUID.randomUUID());
        payload.setWagonNumber("42691234");
        payload.setOperationCode("20");
        payload.setOperationDatetime(Instant.now());
        payload.setFlightStartStationCode("194300");
        payload.setFlightStartDate(Instant.now());
        payload.setDestinationStationCode("648400");
        payload.setTrainNumber("3221");

        when(eventRepo.existsByRzdId(any())).thenReturn(false);
        when(eventRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(wagonRepo.findByWagonNumber("42691234")).thenReturn(Optional.empty());
        when(wagonRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(tripRepo.findActiveTrip(any(), any(), any(), any(), any())).thenReturn(Optional.empty());
        when(tripRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        service.process(payload);

        verify(tripRepo, times(1)).save(any(WagonTrip.class));
        verify(wagonRepo, atLeast(1)).save(any(Wagon.class));
    }

    @Test
    void shouldCloseTripWhenWagonArrivesAtDestination() {
        Wagon existingWagon = Wagon.builder().wagonNumber("42691234").build();

        WagonTrip existingTrip = WagonTrip.builder()
                .wagon(existingWagon)
                .dstStationCode("648400")
                .depStationCode("194300")
                .startedAt(Instant.now().minusSeconds(3600))
                .status(TripStatus.ACTIVE)
                .build();

        DislocationWebhookPayload payload = new DislocationWebhookPayload();
        payload.setRzdId(UUID.randomUUID());
        payload.setWagonNumber("42691234");
        payload.setOperationCode("96");
        payload.setOperationDatetime(Instant.now());
        payload.setStationCode("648400");
        payload.setFlightStartStationCode("194300");
        payload.setFlightStartDate(Instant.now().minusSeconds(3600));
        payload.setDestinationStationCode("648400");

        when(eventRepo.existsByRzdId(any())).thenReturn(false);
        when(eventRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(wagonRepo.findByWagonNumber("42691234")).thenReturn(Optional.of(existingWagon));
        when(wagonRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(tripRepo.findActiveTrip(any(), eq("194300"), any(), any(), eq(TripStatus.ACTIVE)))
                .thenReturn(Optional.of(existingTrip));
        when(tripRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        service.process(payload);

        verify(tripRepo, atLeastOnce()).save(argThat(t ->
                TripStatus.COMPLETED.equals(((WagonTrip) t).getStatus())
        ));
    }
}
