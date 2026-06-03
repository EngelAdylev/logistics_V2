package ru.alabuga.dislocation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.train.TrainSummaryDto;
import ru.alabuga.dislocation.dto.wagon.WagonDto;
import ru.alabuga.dislocation.model.Wagon;
import ru.alabuga.dislocation.repository.WagonRepository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TrainService {

    private static final String OUR_STATION = "648400";

    private final WagonRepository wagonRepo;
    private final WagonService wagonService;

    public List<TrainSummaryDto> getTrains() {
        List<Wagon> wagons = wagonRepo.findAllInTrains();

        // Группировка по (trainNumber, trainIndex)
        Map<String, List<Wagon>> groups = new LinkedHashMap<>();
        for (Wagon w : wagons) {
            String key = w.getCurrentTrainNumber() + "|" +
                    (w.getCurrentTrainIndex() != null ? w.getCurrentTrainIndex() : "");
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(w);
        }

        return groups.entrySet().stream().map(e -> {
            List<Wagon> group = e.getValue();
            Wagon first = group.get(0);

            OptionalDouble avg = group.stream()
                    .filter(w -> w.getRemainingDistance() != null)
                    .mapToInt(Wagon::getRemainingDistance)
                    .average();

            int arrived = 0, incoming = 0, other = 0;
            for (Wagon w : group) {
                String dest = w.getDestinationStationCode();
                String op   = w.getOperationCode();
                String sta  = w.getStationCode();
                if (OUR_STATION.equals(dest) && ("96".equals(op)
                        || ("20".equals(op) && OUR_STATION.equals(sta)))) arrived++;
                else if (OUR_STATION.equals(dest)) incoming++;
                else other++;
            }

            return TrainSummaryDto.builder()
                    .trainNumber(first.getCurrentTrainNumber())
                    .trainIndex(first.getCurrentTrainIndex())
                    .wagonCount(group.size())
                    .avgRemainingDistance(avg.isPresent() ? (int) Math.round(avg.getAsDouble()) : null)
                    .arrivedCount(arrived)
                    .incomingCount(incoming)
                    .otherCount(other)
                    .build();
        }).sorted(
            Comparator.<TrainSummaryDto>comparingInt(t -> {
                if (t.getArrivedCount() > 0)  return 0; // уже на нашей станции
                if (t.getIncomingCount() > 0) return 1; // едут к нам
                return 2;                                // остальные
            }).thenComparingInt(t ->
                t.getAvgRemainingDistance() != null ? t.getAvgRemainingDistance() : Integer.MAX_VALUE
            )
        ).toList();
    }

    public List<WagonDto> getWagons(String trainNumber, String trainIndex) {
        return wagonService.getByTrain(
                trainNumber,
                (trainIndex == null || trainIndex.isBlank()) ? null : trainIndex
        );
    }
}
