package ru.alabuga.analytics.util;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class SystemMapperTest {

    @Test
    void outbound_cargo_task_maps_to_wms() {
        assertThat(SystemMapper.fromMessageType("CARGO_RECEIVING_TASK")).isEqualTo("WMS");
        assertThat(SystemMapper.fromMessageType("CARGO_SHIPMENT_TASK")).isEqualTo("WMS");
    }

    @Test
    void outbound_manifest_maps_to_tos() {
        assertThat(SystemMapper.fromMessageType("RECEIVING_TRANSPORT_MANIFEST")).isEqualTo("TOS");
        assertThat(SystemMapper.fromMessageType("SHIPMENT_TRANSPORT_MANIFEST")).isEqualTo("TOS");
    }

    @Test
    void outbound_contractor_maps_to_1c() {
        assertThat(SystemMapper.fromMessageType("CONTRACTOR")).isEqualTo("1C");
    }

    @Test
    void outbound_unknown_maps_to_datareon() {
        assertThat(SystemMapper.fromMessageType("UNKNOWN_TYPE")).isEqualTo("DATAREON");
    }

    @Test
    void inbound_load_events_map_to_tos() {
        assertThat(SystemMapper.fromEventCode("LOAD_FINISH")).isEqualTo("TOS");
        assertThat(SystemMapper.fromEventCode("UNLOAD_FINISH")).isEqualTo("TOS");
        assertThat(SystemMapper.fromEventCode("DOCK_ASG")).isEqualTo("TOS");
    }

    @Test
    void inbound_status_events_map_to_wms() {
        assertThat(SystemMapper.fromEventCode("STATUS_IN_WORK")).isEqualTo("WMS");
    }
}
