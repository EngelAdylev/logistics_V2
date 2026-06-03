package ru.alabuga.dislocation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.model.DislocationRecord;
import ru.alabuga.dislocation.model.SyncCursor;
import ru.alabuga.dislocation.repository.DislocationRecordRepository;
import ru.alabuga.dislocation.repository.SyncCursorRepository;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DislocationSyncService {

    private static final int BATCH_SIZE = 500;

    private final DislocationRecordRepository dislocRepo;
    private final SyncCursorRepository cursorRepo;
    private final DislocationProcessingService processingService;

    @Scheduled(fixedDelayString = "${sync.interval-ms:600000}", initialDelayString = "${sync.initial-delay-ms:10000}")
    @Transactional
    public void sync() {
        SyncCursor cursor = cursorRepo.findById(1L).orElseGet(() -> {
            SyncCursor c = new SyncCursor();
            c.setId(1L);
            c.setLastProcessedAt(Instant.EPOCH);
            return cursorRepo.save(c);
        });

        Instant since = cursor.getLastProcessedAt();
        List<DislocationRecord> records = dislocRepo.findNewRecords(since, PageRequest.of(0, BATCH_SIZE));

        if (records.isEmpty()) {
            log.debug("No new dislocation records since {}", since);
            return;
        }

        log.info("Syncing {} dislocation records (since {})", records.size(), since);
        int processed = 0;
        Instant lastAt = since;

        for (DislocationRecord record : records) {
            try {
                processingService.process(record);
                processed++;
                if (record.getCreatedAt() != null) {
                    lastAt = record.getCreatedAt();
                }
            } catch (Exception e) {
                log.error("Failed to process dislocation record {}: {}", record.getId(), e.getMessage());
            }
        }

        cursor.setLastProcessedAt(lastAt);
        cursorRepo.save(cursor);

        log.info("Sync complete: {}/{} records processed, cursor now at {}", processed, records.size(), lastAt);
    }
}
