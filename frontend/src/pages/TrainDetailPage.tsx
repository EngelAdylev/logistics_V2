import { Box, Typography, Button, Chip, Divider, CircularProgress, Alert, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { trainsApi } from '../api/trains';
import WagonTable from '../components/WagonTable';

export default function TrainDetailPage() {
  const navigate = useNavigate();
  const { trainNumber } = useParams<{ trainNumber: string }>();
  const [searchParams] = useSearchParams();
  const trainIndex = searchParams.get('index');

  const { data: trains = [], isLoading, error } = useQuery({
    queryKey: ['trains'],
    queryFn: trainsApi.getAll,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Не удалось загрузить данные</Alert>;
  }

  const train = trainNumber
    ? trains.find(t =>
        t.trainNumber === trainNumber &&
        (t.trainIndex ?? null) === (trainIndex ?? null)
      )
    : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Навигация */}
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/trains')}
          size="small"
          sx={{ mb: 1 }}>
          Все поезда
        </Button>

        {/* Шапка поезда */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <DirectionsRailwayIcon sx={{ color: 'text.secondary', mt: 0.25, flexShrink: 0 }} fontSize="large" />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
                Поезд {trainNumber}
              </Typography>
              {trainIndex && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Индекс: {trainIndex}
                </Typography>
              )}
            </Box>

            {train && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {train.arrivedCount > 0 && (
                    <Chip size="small" label={`На станции: ${train.arrivedCount}`}
                      sx={{ bgcolor: '#f44336', color: '#fff' }} />
                  )}
                  {train.incomingCount > 0 && (
                    <Chip size="small" label={`К нам: ${train.incomingCount}`}
                      sx={{ bgcolor: '#4caf50', color: '#fff' }} />
                  )}
                  {train.otherCount > 0 && (
                    <Chip size="small" label={`Другие: ${train.otherCount}`}
                      sx={{ bgcolor: '#2196f3', color: '#fff' }} />
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">Вагонов</Typography>
                    <Typography variant="body1" fontWeight={600}>{train.wagonCount}</Typography>
                  </Box>
                  {train.avgRemainingDistance != null && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">До пункта</Typography>
                      <Typography variant="body1" fontWeight={600}>~{train.avgRemainingDistance} км</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <Divider />

      {/* Таблица вагонов */}
      {trainNumber && (
        <WagonTable trainNumber={trainNumber} trainIndex={trainIndex} />
      )}
    </Box>
  );
}
