package ru.alabuga.dislocation.dto.wagon;

import lombok.Data;
import ru.alabuga.dislocation.filter.WagonFilter;

@Data
public class WagonPageRequest {
    private WagonFilter filter;
    private int page = 0;
    private int size = 50;
}
