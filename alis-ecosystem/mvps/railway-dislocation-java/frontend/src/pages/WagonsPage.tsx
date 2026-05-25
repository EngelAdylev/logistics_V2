import { useState, useEffect, useRef } from 'react';
import { Box, TextField, Typography, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { wagonsApi } from '../api/wagons';
import type { WagonDto } from '../api/wagons';

const fmt = (v: string | null | undefined) => v ?? '—';
const fmtKm = (v: number | null | undefined) => v != null ? `${v} км` : '—';
const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const COLUMNS: GridColDef<WagonDto>[] = [
  { field: 'wagonNumber',    headerName: 'Вагон',         width: 120 },
  {
    field: 'stationName', headerName: 'Станция', flex: 1,
    valueGetter: (_v, row) => row.stationName || row.stationCode || '—',
  },
  { field: 'currentTrainNumber', headerName: 'Поезд',        width: 100,
    valueFormatter: fmt },
  { field: 'remainingDistance',  headerName: 'До пункта',    width: 115,
    valueFormatter: fmtKm },
  { field: 'operationName',      headerName: 'Операция',      flex: 1,
    valueFormatter: fmt },
  { field: 'lastSeenAt',         headerName: 'Обновлён',      width: 140,
    valueFormatter: fmtDate },
];

export default function WagonsPage() {
  const navigate = useNavigate();
  const [search, setSearch]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage]           = useState(0);
  const pageSize = 50;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['wagons', page, debouncedSearch],
    queryFn: () => wagonsApi.getPage({
      filter: debouncedSearch ? { wagonNumber: debouncedSearch } : undefined,
      page,
      size: pageSize,
    }),
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6">Вагоны</Typography>
        <TextField
          size="small"
          placeholder="Поиск по номеру"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: 220 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              ),
            },
          }}
        />
        {data && (
          <Typography variant="body2" color="text.secondary">
            Всего: {data.totalElements}
          </Typography>
        )}
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
        onRowClick={({ row }) => {
          const wagon = row as WagonDto;
          if (wagon.activeTripId) navigate(`/trips/${wagon.activeTripId}`);
        }}
        sx={{
          flex: 1,
          '& .MuiDataGrid-row': {
            cursor: 'default',
          },
          '& .MuiDataGrid-row[data-has-trip="true"]': {
            cursor: 'pointer',
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: 'action.hover',
          },
        }}
        getRowClassName={({ row }) => (row.activeTripId ? 'has-trip' : '')}
        slotProps={{
          noRowsOverlay: {
            sx: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
          },
        }}
      />
    </Box>
  );
}
