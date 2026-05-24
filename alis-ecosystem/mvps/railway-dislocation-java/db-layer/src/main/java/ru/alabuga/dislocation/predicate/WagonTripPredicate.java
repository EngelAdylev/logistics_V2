package ru.alabuga.dislocation.predicate;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Predicate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import ru.alabuga.dislocation.filter.WagonTripFilter;
import ru.alabuga.dislocation.model.QWagonTrip;

@Component
public class WagonTripPredicate {

    public Predicate build(WagonTripFilter filter) {
        if (filter == null) return new BooleanBuilder();

        QWagonTrip t = QWagonTrip.wagonTrip;
        BooleanBuilder builder = new BooleanBuilder();

        if (StringUtils.hasText(filter.getWagonNumber())) {
            builder.and(t.wagon.wagonNumber.containsIgnoreCase(filter.getWagonNumber()));
        }
        if (StringUtils.hasText(filter.getDepStationCode())) {
            builder.and(t.depStationCode.eq(filter.getDepStationCode()));
        }
        if (StringUtils.hasText(filter.getDstStationCode())) {
            builder.and(t.dstStationCode.eq(filter.getDstStationCode()));
        }
        if (filter.getStatus() != null) {
            builder.and(t.status.eq(filter.getStatus()));
        }

        return builder;
    }
}
