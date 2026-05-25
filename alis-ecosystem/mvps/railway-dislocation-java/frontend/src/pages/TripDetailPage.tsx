import { Box, Typography, Chip, Divider, Paper, Stack, Skeleton, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { tripsApi } from '../api/trips';
import type { TripEventDto } from '../api/trips';

const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function EventRow({ event }: { event: TripEventDto }) {
  const stationLabel = event.stationName || event.stationCode || '—';

  return (
    <Box sx={{ display: 'flex', gap: 2, py: 1.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130, flexShrink: 0 }}>
        {fmtDate(event.operationDatetime)}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={500}>
          {event.operationName || `Операция ${event.operationCode}` || '—'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {stationLabel}
          {event.trainNumber && ` · Поезд ${event.trainNumber}`}
          {event.remainingDistance != null && ` · ${event.remainingDistance} км`}
        </Typography>
        {event.containerNumbers && event.containerNumbers.length > 0 && (
          <Typography variant="caption" display="block" color="text.secondary">
            Контейнеры: {event.containerNumbers.join(', ')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripsApi.getById(id!),
    enabled: !!id,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['trip-events', id],
    queryFn: () => tripsApi.getEvents(id!),
    enabled: !!id,
  });

  return (
    <Box sx={{ maxWidth: 860 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ mb: 2, color: 'text.secondary' }}
        onClick={() => navigate('/trips')}>
        К списку рейсов
      </Button>

      <Paper sx={{ p: 2.5, mb: 2 }}>
        {tripLoading ? (
          <>
            <Skeleton width={200} height={32} />
            <Skeleton width={300} />
            <Skeleton width={220} />
          </>
        ) : trip ? (
          <>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Вагон {trip.wagonNumber ?? '—'}</Typography>
              <Chip
                size="small"
                label={trip.status === 'ACTIVE' ? 'Активен' : 'Завершён'}
                color={trip.status === 'ACTIVE' ? 'success' : 'default'}
              />
            </Stack>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {trip.depStationName || trip.depStationCode || '—'}
              {' → '}
              {trip.dstStationName || trip.dstStationCode || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Начат: {fmtDate(trip.startedAt)}
              {trip.finishedAt && ` · Завершён: ${fmtDate(trip.finishedAt)}`}
            </Typography>
          </>
        ) : null}
      </Paper>

      <Typography variant="subtitle2" gutterBottom>
        {eventsLoading ? <Skeleton width={180} /> : `История операций (${events.length})`}
      </Typography>

      <Paper sx={{ p: 2 }}>
        {eventsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ py: 1.5 }}>
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </Box>
          ))
        ) : events.length === 0 ? (
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
