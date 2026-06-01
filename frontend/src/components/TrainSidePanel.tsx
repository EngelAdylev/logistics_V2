import {
  Box, Typography, IconButton, Chip, Button, Divider, Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import type { TrainSummaryDto } from '../api/trains';

interface Props {
  train: TrainSummaryDto;
  onClose: () => void;
  onOpenDetail: () => void;
}

export default function TrainSidePanel({ train, onClose, onOpenDetail }: Props) {
  return (
    <Box>
      {/* Шапка */}
      <Box sx={{
        display: 'flex', alignItems: 'flex-start', gap: 1,
        px: 2, py: 1.5, bgcolor: 'grey.50',
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <DirectionsRailwayIcon sx={{ mt: 0.25, color: 'text.secondary', flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            {train.trainNumber}
          </Typography>
          {train.trainIndex && (
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              {train.trainIndex}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Тело */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack spacing={1} sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Вагонов</Typography>
            <Typography variant="body2" fontWeight={600}>{train.wagonCount}</Typography>
          </Box>
          {train.avgRemainingDistance != null && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">До пункта</Typography>
              <Typography variant="body2" fontWeight={600}>~{train.avgRemainingDistance} км</Typography>
            </Box>
          )}
        </Stack>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
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
      </Box>

      <Divider />

      {/* Кнопка */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Button
          variant="contained"
          fullWidth
          endIcon={<OpenInNewIcon />}
          onClick={onOpenDetail}>
          Подробнее
        </Button>
        <Typography variant="caption" color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 0.75 }}>
          или двойной клик по строке
        </Typography>
      </Box>
    </Box>
  );
}
