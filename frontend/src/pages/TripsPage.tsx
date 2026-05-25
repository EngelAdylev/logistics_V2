import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Chip, Stack, TextField, InputAdornment } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import { tripsApi } from '../api/trips';
import type { TripDto } from '../api/trips';
import type { TripStatus } from '../api/types';

type StatusFilter = 'ALL' | TripStatus;

const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const fmtStation = (name: string | null, code: string | null) =>
  name || code || '—';

const STATUS_BUTTONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL',       label: 'Все' },
  { value: 'ACTIVE',    label: 'Активные' },
  { value: 'COMPLETED', label: 'Завершённые' },
];

const STATUS_COLOR: Record<TripStatus, 'success' | 'default'> = {
  ACTIVE: 'success',
  COMPLETED: 'default',
};

const STATUS_LABEL: Record<TripStatus, string> = {
  ACTIVE: 'Активен',
  COMPLETED: 'Завершён',
};

const COLUMNS: GridColDef<TripDto>[] = [
  { field: 'wagonNumber',    headerName: 'Вагон',   width: 120, valueFormatter: v => v ?? '—' },
  {
    field: 'depStationName', headerName: 'Откуда',  flex: 1,
    valueGetter: (_v, row) => fmtStation(row.depStationName, row.depStationCode),
  },
  {
    field: 'dstStationName', headerName: 'Куда',    flex: 1,
    valueGetter: (_v, row) => fmtStation(row.dstStationName, row.dstStationCode),
  },
  { field: 'startedAt',      headerName: 'Начат',   width: 140, valueFormatter: fmtDate },
  {
    field: 'status', headerName: 'Статус', width: 130,
    renderCell: ({ value }: GridRenderCellParams<TripDto, TripStatus>) => (
      <Chip size="small" label={STATUS_LABEL[value]} color={STATUS_COLOR[value]} />
    ),
  },
];

export default function TripsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage]                 = useState(0);
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

  const filter = {
    ...(statusFilter !== 'ALL' ? { status: statusFilter as TripStatus } : {}),
    ...(debouncedSearch ? { wagonNumber: debouncedSearch } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['trips', page, statusFilter, debouncedSearch],
    queryFn: () => tripsApi.getPage({
      filter: Object.keys(filter).length ? filter : undefined,
      page,
      size: pageSize,
    }),
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">Рейсы</Typography>

        <TextField
          size="small"
          placeholder="Номер вагона"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: 180 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              ),
            },
          }}
        />

        <Stack direction="row" spacing={0.5}>
          {STATUS_BUTTONS.map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              size="small"
              clickable
              variant={statusFilter === value ? 'filled' : 'outlined'}
              color={statusFilter === value ? 'primary' : 'default'}
              onClick={() => { setStatusFilter(value); setPage(0); }}
            />
          ))}
        </Stack>

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
        onRowClick={({ id }) => navigate(`/trips/${String(id)}`)}
        sx={{
          flex: 1,
          '& .MuiDataGrid-row': { cursor: 'pointer' },
          '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
        }}
      />
    </Box>
  );
}
