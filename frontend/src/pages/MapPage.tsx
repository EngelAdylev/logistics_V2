import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import type { WagonMapDto } from '../api/wagons';
import { wagonsApi } from '../api/wagons';

const OUR_STATION = '648400';

type MarkerVariant = 'arrived' | 'incoming' | 'other';

function getVariant(wagon: WagonMapDto): MarkerVariant {
  if (wagon.operationCode === '96' && wagon.destinationStationCode === OUR_STATION) return 'arrived';
  if (wagon.destinationStationCode === OUR_STATION) return 'incoming';
  return 'other';
}

const VARIANT_COLOR: Record<MarkerVariant, string> = {
  arrived:  '#f44336',
  incoming: '#4caf50',
  other:    '#2196f3',
};

const VARIANT_LABEL: Record<MarkerVariant, string> = {
  arrived:  'На нашей станции',
  incoming: 'Едет к нам',
  other:    'Другие',
};

export default function MapPage() {
  const navigate = useNavigate();

  const { data: wagons = [], isLoading } = useQuery({
    queryKey: ['wagons-map'],
    queryFn: wagonsApi.getForMap,
    refetchInterval: 60_000,
  });

  const counts = wagons.reduce<Record<MarkerVariant, number>>(
    (acc, w) => { acc[getVariant(w)]++; return acc; },
    { arrived: 0, incoming: 0, other: 0 },
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{
        display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap',
        px: 2, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider',
      }}>
        {isLoading
          ? <CircularProgress size={16} />
          : <Typography variant="body2" color="text.secondary">Вагонов: {wagons.length}</Typography>
        }
        {(['arrived', 'incoming', 'other'] as MarkerVariant[]).map(v => (
          <Chip key={v} size="small"
            label={`${VARIANT_LABEL[v]}: ${counts[v]}`}
            sx={{ bgcolor: VARIANT_COLOR[v], color: '#fff', fontWeight: 500 }} />
        ))}
      </Box>

      <Box sx={{ flex: 1 }}>
        <MapContainer
          center={[56.0, 54.0]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {wagons.map(wagon => {
            const variant = getVariant(wagon);
            return (
              <CircleMarker
                key={wagon.id}
                center={[Number(wagon.lat), Number(wagon.lng)]}
                radius={7}
                pathOptions={{
                  fillColor: VARIANT_COLOR[variant],
                  color: '#fff',
                  weight: 1.5,
                  fillOpacity: 0.9,
                }}>
                <Popup>
                  <Box sx={{ minWidth: 190 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Вагон {wagon.wagonNumber}
                    </Typography>
                    {wagon.trainNumber && (
                      <Typography variant="body2">Поезд: {wagon.trainNumber}</Typography>
                    )}
                    {wagon.remainingDistance != null && (
                      <Typography variant="body2">До пункта: {wagon.remainingDistance} км</Typography>
                    )}
                    {wagon.destinationStationCode && (
                      <Typography variant="body2">Назначение: {wagon.destinationStationCode}</Typography>
                    )}
                    {wagon.activeTripId && (
                      <Typography
                        variant="body2"
                        sx={{ mt: 1, color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigate(`/trips/${wagon.activeTripId}`)}>
                        Открыть рейс →
                      </Typography>
                    )}
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
