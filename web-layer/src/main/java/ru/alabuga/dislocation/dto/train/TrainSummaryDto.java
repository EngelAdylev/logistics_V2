package ru.alabuga.dislocation.dto.train;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TrainSummaryDto {
    private String trainNumber;
    private String trainIndex;
    private int wagonCount;
    private Integer avgRemainingDistance;
    private int arrivedCount;   // op=96 + dest=648400
    private int incomingCount;  // dest=648400, остальные
    private int otherCount;
}
