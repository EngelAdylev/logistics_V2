package ru.alabuga.dislocation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.model.TripStatus;
import ru.alabuga.dislocation.model.Wagon;
import ru.alabuga.dislocation.model.WagonTrip;
import ru.alabuga.dislocation.repository.WagonRepository;
import ru.alabuga.dislocation.repository.WagonTripRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Авто-архивация «зависших» вагонов: если по вагону не было операций дольше
 * заданного порога (по умолчанию 30 дней), его активный рейс закрывается,
 * а вагон уходит из активных списков.
 *
 * Работает по расписанию, т.к. shouldArchive срабатывает только на входящем
 * событии — а у забытого вагона событий больше не приходит.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArchivingService {

    @Value("${archive.stale-days:30}")
    private long staleDays;

    private final WagonRepository wagonRepo;
    private final WagonTripRepository tripRepo;

    @Scheduled(
            initialDelayString = "${archive.initial-delay-ms:120000}",
            fixedDelayString   = "${archive.interval-ms:21600000}")   // каждые 6 часов
    @Transactional
    public void archiveStale() {
        Instant cutoff = Instant.now().minus(staleDays, ChronoUnit.DAYS);
        List<Wagon> stale = wagonRepo.findStaleActive(cutoff);
        if (stale.isEmpty()) {
            log.debug("Авто-архив: зависших вагонов нет (порог {} дней)", staleDays);
            return;
        }

        Instant now = Instant.now();
        for (Wagon w : stale) {
            WagonTrip trip = w.getActiveTrip();
            if (trip != null) {
                trip.setStatus(TripStatus.COMPLETED);
                trip.setFinishedAt(now);
                tripRepo.save(trip);
            }
            w.setActiveTrip(null);
            w.setCurrentTrainNumber(null);
            w.setCurrentTrainIndex(null);
            w.setWagonPosition(null);
            wagonRepo.save(w);
        }
        log.info("Авто-архив: закрыто {} вагонов без операций более {} дней", stale.size(), staleDays);
    }
}
