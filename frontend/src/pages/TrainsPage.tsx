import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, CircularProgress, Alert, Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { trainsApi } from '../api/trains';
import type { TrainSummaryDto } from '../api/trains';
import TrainSidePanel from '../components/TrainSidePanel';

export function trainKey(t: TrainSummaryDto) {
  return `${t.trainNumber}|${t.trainIndex ?? ''}`;
}

export function trainDetailPath(t: TrainSummaryDto) {
  const base = `/trains/${encodeURIComponent(t.trainNumber)}`;
  return t.trainIndex ? `${base}?index=${encodeURIComponent(t.trainIndex)}` : base;
}

function variantColor(t: TrainSummaryDto) {
  if (t.arrivedCount > 0) return '#f44336';
  if (t.incomingCount > 0) return '#4caf50';
  return '#2196f3';
}

const COLUMNS: GridColDef<TrainSummaryDto>[] = [
  {
    field: '_dot', headerName: '', width: 28, sortable: false, filterable: false,
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: variantColor(row) }} />
      </Box>
    ),
  },
  {
    field: 'trainNumber', headerName: 'Поезд', width: 100,
  },
  {
    field: 'trainIndex', headerName: 'Индекс', flex: 1, minWidth: 140,
    valueFormatter: (v) => v ?? '—',
  },
  {
    field: 'wagonCount', headerName: 'Вагонов', width: 90, type: 'number',
  },
  {
    field: '_badges', headerName: 'Статус', flex: 1, minWidth: 180,
    sortable: false, filterable: false,
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
        {row.arrivedCount > 0 && (
          <Chip size="small" label={`На станции: ${row.arrivedCount}`}
            sx={{ bgcolor: '#f44336', color: '#fff', fontSize: 10, height: 20 }} />
        )}
        {row.incomingCount > 0 && (
          <Chip size="small" label={`К нам: ${row.incomingCount}`}
            sx={{ bgcolor: '#4caf50', color: '#fff', fontSize: 10, height: 20 }} />
        )}
        {row.otherCount > 0 && (
          <Chip size="small" label={`Другие: ${row.otherCount}`}
            sx={{ bgcolor: '#2196f3', color: '#fff', fontSize: 10, height: 20 }} />
        )}
      </Box>
    ),
  },
  {
    field: 'avgRemainingDistance', headerName: 'До пункта', width: 110, type: 'number',
    valueFormatter: (v) => v != null ? `~${v} км` : '—',
  },
];

export default function TrainsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openTrainParam = searchParams.get('train');
  const openIndexParam = searchParams.get('index');

  const [selectedTrain, setSelectedTrain] = useState<TrainSummaryDto | null>(null);
  const autoSelectedRef = useRef(false);

  const { data: trains = [], isLoading, error } = useQuery({
    queryKey: ['trains'],
    queryFn: trainsApi.getAll,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!autoSelectedRef.current && openTrainParam && trains.length > 0) {
      const key = `${openTrainParam}|${openIndexParam ?? ''}`;
      const found = trains.find(t => trainKey(t) === key);
      if (found) {
        setSelectedTrain(found);
        autoSelectedRef.current = true;
      }
    }
  }, [trains, openTrainParam, openIndexParam]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Не удалось загрузить список поездов</Alert>;
  }

  const totalWagons = trains.reduce((s, t) => s + t.wagonCount, 0);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      {/* Список поездов */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">Поезда</Typography>
          <Typography variant="body2" color="text.secondary">
            {trains.length} поездов · {totalWagons} вагонов
          </Typography>
        </Box>

        <DataGrid
          rows={trains}
          columns={COLUMNS}
          getRowId={trainKey}
          autoHeight
          density="standard"
          disableRowSelectionOnClick
          rowSelectionModel={selectedTrain ? [trainKey(selectedTrain)] : []}
          onRowClick={({ row }) => {
            setSelectedTrain(prev =>
              prev && trainKey(prev) === trainKey(row) ? null : row
            );
          }}
          onRowDoubleClick={({ row }) => navigate(trainDetailPath(row))}
          sx={{
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-row.Mui-selected': {
              bgcolor: 'primary.50',
              '&:hover': { bgcolor: 'primary.100' },
            },
          }}
          hideFooter={trains.length <= 100}
        />

        {trains.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">Нет активных поездов</Typography>
          </Box>
        )}
      </Box>

      {/* Правая панель */}
      {selectedTrain && (
        <Box sx={{
          width: 300,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          borderLeft: '1px solid',
          borderColor: 'divider',
          ml: 2,
        }}>
          <TrainSidePanel
            train={selectedTrain}
            onClose={() => setSelectedTrain(null)}
            onOpenDetail={() => navigate(trainDetailPath(selectedTrain))}
          />
        </Box>
      )}
    </Box>
  );
}
