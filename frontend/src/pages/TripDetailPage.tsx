import { Box, Typography, Chip, Divider, Paper, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { tripsApi } from '../api/trips';
import type { TripEventDto } from '../api/trips';

function EventRow({ event }: { event: TripEventDto }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
        {event.operationDatetime
          ? new Date(event.operationDatetime).toLocaleString('ru')
          : '—'}
      </Typography>
      <Box>
        <Typography variant="body2" fontWeight={500}>{event.operationName}</Typography>
        <Typography variant="caption" color="text.secondary">
          {event.stationCode} · {event.trainNumber && `Поезд ${event.trainNumber}`}
          {event.remainingDistance != null && ` · ${event.remainingDistance} км`}
        </Typography>
        {event.containerNumbers?.length ? (
          <Typography variant="caption" display="block">
            Контейнеры: {event.containerNumbers.join(', ')}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: trip } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripsApi.getById(id!),
    enabled: !!id,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['trip-events', id],
    queryFn: () => tripsApi.getEvents(id!),
    enabled: !!id,
  });

  if (!trip) return null;

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, cursor: 'pointer' }}
        onClick={() => navigate(-1)}>
        <ArrowBackIcon fontSize="small" />
        <Typography variant="body2">Назад к рейсам</Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Вагон {trip.wagonNumber}</Typography>
          <Chip size="small"
            label={trip.status === 'ACTIVE' ? 'Активен' : 'Завершён'}
            color={trip.status === 'ACTIVE' ? 'success' : 'default'} />
        </Stack>
        <Typography variant="body2">
          {trip.depStationName ?? trip.depStationCode} → {trip.dstStationName ?? trip.dstStationCode}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Начат: {trip.startedAt ? new Date(trip.startedAt).toLocaleString('ru') : '—'}
          {trip.finishedAt && ` · Завершён: ${new Date(trip.finishedAt).toLocaleString('ru')}`}
        </Typography>
      </Paper>

      <Typography variant="subtitle2" gutterBottom>
        История операций ({events.length})
      </Typography>
      <Paper sx={{ p: 2 }}>
        {events.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Нет данных</Typography>
        ) : (
          events.map((event, i) => (
            <Box key={event.id}>
              <EventRow event={event} />
              {i < events.length - 1 && <Divider />}
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}
