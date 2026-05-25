import { useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { wagonsApi } from '../api/wagons';
import type { WagonDto } from '../api/wagons';

const COLUMNS: GridColDef<WagonDto>[] = [
  { field: 'wagonNumber',    headerName: 'Вагон',     width: 120 },
  { field: 'stationName',    headerName: 'Станция',   flex: 1 },
  { field: 'currentTrainNumber', headerName: 'Поезд', width: 100 },
  { field: 'remainingDistance',  headerName: 'Км до пункта', width: 130,
    valueFormatter: (v: number | null) => v != null ? `${v} км` : '—' },
  { field: 'operationName',  headerName: 'Операция',  flex: 1 },
  { field: 'lastSeenAt',     headerName: 'Обновлён',  width: 170,
    valueFormatter: (v: string | null) => v ? new Date(v).toLocaleString('ru') : '—' },
];

export default function WagonsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['wagons', page, search],
    queryFn: () => wagonsApi.getPage({
      filter: search ? { wagonNumber: search } : undefined,
      page,
      size: pageSize,
    }),
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6">Вагоны</Typography>
        <TextField size="small" placeholder="Поиск по номеру вагона"
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 260 }} />
      </Box>

      <DataGrid
        rows={data?.content ?? []}
        columns={COLUMNS}
        rowCount={data?.totalElements ?? 0}
        loading={isLoading}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={m => setPage(m.page)}
        pageSizeOptions={[50]}
        disableRowSelectionOnClick
        sx={{ flex: 1 }}
      />
    </Box>
  );
}
