import { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tripsApi } from '../api/trips';
import type { TripDto } from '../api/trips';
import type { TripStatus } from '../api/types';

const COLUMNS: GridColDef<TripDto>[] = [
  { field: 'wagonNumber',    headerName: 'Вагон',     width: 120 },
  { field: 'depStationName', headerName: 'Откуда',    flex: 1 },
  { field: 'dstStationName', headerName: 'Куда',      flex: 1 },
  { field: 'startedAt',      headerName: 'Начат',     width: 170,
    valueFormatter: (v: string | null) => v ? new Date(v).toLocaleString('ru') : '—' },
  { field: 'status',         headerName: 'Статус',    width: 130,
    renderCell: ({ value }: GridRenderCellParams<TripDto, TripStatus>) => (
      <Chip size="small"
        label={value === 'ACTIVE' ? 'Активен' : 'Завершён'}
        color={value === 'ACTIVE' ? 'success' : 'default'} />
    )},
];

export default function TripsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['trips', page],
    queryFn: () => tripsApi.getPage({ page, size: pageSize }),
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Рейсы</Typography>

      <DataGrid
        rows={data?.content ?? []}
        columns={COLUMNS}
        rowCount={data?.totalElements ?? 0}
        loading={isLoading}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={m => setPage(m.page)}
        pageSizeOptions={[50]}
        onRowClick={({ id }) => navigate(`/trips/${String(id)}`)}
        sx={{ flex: 1, cursor: 'pointer' }}
      />
    </Box>
  );
}
