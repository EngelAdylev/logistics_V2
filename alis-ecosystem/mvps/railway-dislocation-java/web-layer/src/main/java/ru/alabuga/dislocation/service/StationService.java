package ru.alabuga.dislocation.service;

import com.opencsv.CSVReader;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.alabuga.dislocation.dto.StationDto;
import ru.alabuga.dislocation.model.RailwayStation;
import ru.alabuga.dislocation.repository.RailwayStationRepository;

import com.opencsv.exceptions.CsvValidationException;

import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StationService {

    private final RailwayStationRepository stationRepo;

    public List<StationDto> getAll() {
        return stationRepo.findAll().stream()
                .map(s -> StationDto.builder()
                        .code(s.getCode())
                        .name(s.getName())
                        .lat(s.getLat())
                        .lng(s.getLng())
                        .build())
                .toList();
    }

    public StationDto getByCode(String code) {
        return stationRepo.findById(code)
                .map(s -> StationDto.builder()
                        .code(s.getCode()).name(s.getName())
                        .lat(s.getLat()).lng(s.getLng()).build())
                .orElseThrow(() -> new EntityNotFoundException("Station not found: " + code));
    }

    @Transactional
    public int syncFromCsv(MultipartFile file) throws IOException, CsvValidationException {
        List<RailwayStation> batch = new ArrayList<>();
        int skipped = 0;

        try (CSVReader reader = new CSVReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String[] header = reader.readNext();
            if (header == null) {
                log.warn("CSV file is empty");
                return 0;
            }
            String[] line;
            while ((line = reader.readNext()) != null) {
                if (line.length < 4) { skipped++; continue; }
                try {
                    batch.add(RailwayStation.builder()
                            .code(line[0].trim())
                            .name(line[1].trim())
                            .lat(new BigDecimal(line[2].trim()))
                            .lng(new BigDecimal(line[3].trim()))
                            .build());
                } catch (NumberFormatException e) {
                    log.warn("Skipping row with invalid coordinates: {}", (Object) line);
                    skipped++;
                }
            }
        }

        stationRepo.saveAll(batch);
        log.info("Synced {} stations, skipped {} rows", batch.size(), skipped);
        return batch.size();
    }
}
