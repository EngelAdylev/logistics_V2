import { useMemo } from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { wagonsApi } from '../api/wagons';
import type { WagonMapDto } from '../api/wagons';

const OUR_STATION = '648400';

type WagonVariant = 'arrived' | 'incoming' | 'other';

function getVariant(w: WagonMapDto): WagonVariant {
  if (w.destinationStationCode === OUR_STATION) {
    if (w.operationCode === '96') return 'arrived';
    if (w.operationCode === '20' && w.stationCode === OUR_STATION) return 'arrived';
    return 'incoming';
  }
  return 'other';
}

const VARIANT_COLOR: Record<WagonVariant, string> = {
  arrived:  '#f44336',
  incoming: '#4caf50',
  other:    '#2196f3',
};

const VARIANT_LABEL: Record<WagonVariant, string> = {
  arrived:  'На нашей станции',
  incoming: 'Едет к нам',
  other:    'Другие',
};

interface StationGroup {
  stationCode: string;
  stationName: string | null;
  lat: number;
  lng: number;
  wagons: WagonMapDto[];
  dominantVariant: WagonVariant;
  counts: Record<WagonVariant, number>;
}

interface TrainGroup {
  trainNumber: string;
  trainIndex: string | null;
  wagons: WagonMapDto[];
  dominantVariant: WagonVariant;
  counts: Record<WagonVariant, number>;
}

function dominantVariant(counts: Record<WagonVariant, number>): WagonVariant {
  if (counts.arrived > 0) return 'arrived';
  if (counts.incoming > 0) return 'incoming';
  return 'other';
}

function groupByStation(wagons: WagonMapDto[]): StationGroup[] {
  const map = new Map<string, StationGroup>();

  for (const w of wagons) {
    if (!w.stationCode || w.lat == null || w.lng == null) continue;

    // Группируем по stationCode + округлённые координаты —
    // один и тот же код но разные физические точки (станция vs терминал) = разные кластеры
    const latR = Number(w.lat).toFixed(3);
    const lngR = Number(w.lng).toFixed(3);
    const key = `${w.stationCode}_${latR}_${lngR}`;

    let group = map.get(key);
    if (!group) {
      group = {
        stationCode: w.stationCode,
        stationName: w.stationName,
        lat: w.lat,
        lng: w.lng,
        wagons: [],
        dominantVariant: 'other',
        counts: { arrived: 0, incoming: 0, other: 0 },
      };
      map.set(key, group);
    }
    group.wagons.push(w);
    group.counts[getVariant(w)]++;
  }

  for (const g of map.values()) {
    g.dominantVariant = dominantVariant(g.counts);
  }

  return Array.from(map.values());
}

function groupByTrain(wagons: WagonMapDto[]): TrainGroup[] {
  const map = new Map<string, TrainGroup>();

  for (const w of wagons) {
    if (!w.trainNumber) continue;
    const key = `${w.trainNumber}|${w.trainIndex ?? ''}`;
    let group = map.get(key);
    if (!group) {
      group = {
        trainNumber: w.trainNumber,
        trainIndex: w.trainIndex,
        wagons: [],
        dominantVariant: 'other',
        counts: { arrived: 0, incoming: 0, other: 0 },
      };
      map.set(key, group);
    }
    group.wagons.push(w);
    group.counts[getVariant(w)]++;
  }

  for (const g of map.values()) {
    g.dominantVariant = dominantVariant(g.counts);
  }

  return Array.from(map.values());
}

export default function MapPage() {
  const navigate = useNavigate();

  const { data: wagons = [], isLoading } = useQuery({
    queryKey: ['wagons-map'],
    queryFn: wagonsApi.getForMap,
    refetchInterval: 60_000,
  });

  const stations = useMemo(() => groupByStation(wagons), [wagons]);

  const totalCounts = useMemo(() =>
    wagons.reduce<Record<WagonVariant, number>>(
      (acc, w) => { acc[getVariant(w)]++; return acc; },
      { arrived: 0, incoming: 0, other: 0 },
    ), [wagons]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{
        display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap',
        px: 2, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider',
      }}>
        {isLoading
          ? <CircularProgress size={16} />
          : <Typography variant="body2" color="text.secondary">
              Вагонов: {wagons.length} · Станций: {stations.length}
            </Typography>
        }
        {(['arrived', 'incoming', 'other'] as WagonVariant[]).map(v => (
          <Chip key={v} size="small"
            label={`${VARIANT_LABEL[v]}: ${totalCounts[v]}`}
            sx={{ bgcolor: VARIANT_COLOR[v], color: '#fff', fontWeight: 500 }} />
        ))}
      </Box>

      <Box sx={{ flex: 1 }}>
        <MapContainer
          center={[56.0, 54.0]}
          zoom={5}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
          {stations.map(station => {
            const trains = groupByTrain(station.wagons).sort((a, b) => {
              const order: Record<WagonVariant, number> = { arrived: 0, incoming: 1, other: 2 };
              return order[a.dominantVariant] - order[b.dominantVariant];
            });
            const radius = Math.min(5 + Math.floor(Math.sqrt(station.wagons.length) * 1.5), 18);

            return (
              <CircleMarker
                key={station.stationCode}
                center={[station.lat, station.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: VARIANT_COLOR[station.dominantVariant],
                  color: '#fff',
                  weight: 1.5,
                  fillOpacity: 0.85,
                }}>
                <Popup minWidth={230} maxWidth={280}>
                  <Box sx={{ fontFamily: 'inherit' }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25 }}>
                      {station.stationName ?? station.stationCode}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      {station.wagons.length} вагонов · {trains.length} поездов
                      {station.counts.arrived > 0 && (
                        <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>
                          {' '}· {station.counts.arrived} на станции
                        </Box>
                      )}
                      {station.counts.incoming > 0 && (
                        <Box component="span" sx={{ color: '#4caf50', fontWeight: 600 }}>
                          {' '}· {station.counts.incoming} к нам
                        </Box>
                      )}
                    </Typography>

                    <Box sx={{ maxHeight: 220, overflowY: 'auto', mr: -1, pr: 1 }}>
                      {trains.map(train => {
                        const trainKey = `${train.trainNumber}|${train.trainIndex ?? ''}`;
                        return (
                          <Box
                            key={trainKey}
                            onClick={() => {
                              const params = new URLSearchParams({ train: train.trainNumber });
                              if (train.trainIndex) params.set('index', train.trainIndex);
                              navigate(`/trains?${params.toString()}`);
                            }}
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 1,
                              py: 0.4, px: 0.5, borderRadius: 1,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
                            }}>
                            <Box sx={{
                              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              bgcolor: VARIANT_COLOR[train.dominantVariant],
                            }} />
                            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                              {train.trainNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                              {train.wagons.length} ваг.
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </Box>
    </Box>
  );
}
