package ru.alabuga.dislocation.predicate;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Predicate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import ru.alabuga.dislocation.filter.WagonFilter;
import ru.alabuga.dislocation.model.QWagon;

@Component
public class WagonPredicate {

    public Predicate build(WagonFilter filter) {
        if (filter == null) return new BooleanBuilder();

        QWagon w = QWagon.wagon;
        BooleanBuilder builder = new BooleanBuilder();

        if (StringUtils.hasText(filter.getWagonNumber())) {
            builder.and(w.wagonNumber.containsIgnoreCase(filter.getWagonNumber()));
        }
        if (StringUtils.hasText(filter.getTrainNumber())) {
            builder.and(w.currentTrainNumber.eq(filter.getTrainNumber()));
        }
        if (StringUtils.hasText(filter.getStationCode())) {
            builder.and(w.stationCode.eq(filter.getStationCode()));
        }
        if (StringUtils.hasText(filter.getOperationCode())) {
            builder.and(w.operationCode.eq(filter.getOperationCode()));
        }
        if (StringUtils.hasText(filter.getDestinationStationCode())) {
            builder.and(w.destinationStationCode.eq(filter.getDestinationStationCode()));
        }
        if (Boolean.TRUE.equals(filter.getHasContainers())) {
            builder.and(w.containerNumbers.isNotEmpty());
        }

        return builder;
    }
}
