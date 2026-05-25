import { Box, Typography, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { WagonMapDto } from '../api/wagons';
import { wagonsApi } from '../api/wagons';

const OUR_STATION = '648400';

function getMarkerColor(wagon: WagonMapDto): string {
  if (wagon.operationCode === '96' && wagon.destinationStationCode === OUR_STATION) return '#f44336';
  if (wagon.destinationStationCode === OUR_STATION) return '#4caf50';
  return '#2196f3';
}

export default function MapPage() {
  const { data: wagons = [], isLoading } = useQuery({
    queryKey: ['wagons-map'],
    queryFn: wagonsApi.getForMap,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <Box p={3}><Typography>Загрузка карты...</Typography></Box>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography variant="subtitle2">Вагонов на карте: {wagons.length}</Typography>
        <Chip size="small" label="Едет к нам" sx={{ bgcolor: '#4caf50', color: '#fff' }} />
        <Chip size="small" label="Едет от нас" sx={{ bgcolor: '#2196f3', color: '#fff' }} />
        <Chip size="small" label="На станции 648400" sx={{ bgcolor: '#f44336', color: '#fff' }} />
      </Box>

      <Box sx={{ flex: 1, borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer
          center={[56.0, 54.0]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {wagons.map(wagon => (
            <CircleMarker
              key={wagon.id}
              center={[wagon.lat, wagon.lng]}
              radius={8}
              pathOptions={{ fillColor: getMarkerColor(wagon), color: '#fff', weight: 1, fillOpacity: 0.9 }}>
              <Popup>
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
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
                </Box>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </Box>
    </Box>
  );
}
