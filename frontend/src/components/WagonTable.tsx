import { useState, useMemo } from 'react';
import {
  Box, Typography, Collapse, IconButton, Tooltip,
  Divider, Chip,
} from '@mui/material';
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import CommentIcon from '@mui/icons-material/Comment';
import { useQuery } from '@tanstack/react-query';
import { trainsApi } from '../api/trains';
import type { WagonDto } from '../api/wagons';
import CommentsPanel from './CommentsPanel';

const OUR_STATION = '648400';

const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtStr = (v: unknown) => (v as string) || '—';
const fmtKm = (v: unknown) => v != null ? `${v} км` : '—';
const fmtTons = (v: unknown) => v != null ? `${v} т` : '—';

function isArrived(wagon: WagonDto) {
  if (wagon.destinationStationCode !== OUR_STATION) return false;
  if (wagon.operationCode === '96') return true;
  if (wagon.operationCode === '20' && wagon.stationCode === OUR_STATION) return true;
  return false;
}

function WagonColorDot({ wagon }: { wagon: WagonDto }) {
  const color = isArrived(wagon) ? '#f44336'
    : wagon.destinationStationCode === OUR_STATION ? '#4caf50'
    : '#2196f3';
  return (
    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
  );
}

const STATIC_COLUMNS: GridColDef<WagonDto>[] = [
  {
    field: '_color', headerName: '', width: 24, sortable: false, filterable: false,
    renderCell: ({ row }) => <WagonColorDot wagon={row} />,
  },
  { field: 'wagonNumber',              headerName: '№ вагона',            width: 120 },
  { field: 'wagonType',                headerName: 'Тип вагона',           width: 130, valueFormatter: fmtStr },
  { field: 'wagonPosition',            headerName: 'Позиция',             width: 80,  valueFormatter: (v) => v ?? '—' },
  { field: 'stationName',              headerName: 'Станция',              flex: 1, minWidth: 150,
    valueGetter: (_v, row) => row.stationName || row.stationCode || '—' },
  { field: 'operationName',            headerName: 'Операция',             flex: 1, minWidth: 160, valueFormatter: fmtStr },
  { field: 'remainingDistance',        headerName: 'До пункта',            width: 110, valueFormatter: fmtKm },
  { field: 'distanceTraveled',         headerName: 'Пройдено',             width: 100, valueFormatter: fmtKm },
  { field: 'totalDistance',            headerName: 'Всего км',             width: 100, valueFormatter: fmtKm },
  { field: 'destinationStationName',   headerName: 'Назначение',           flex: 1, minWidth: 150,
    valueGetter: (_v, row) => row.destinationStationName || row.destinationStationCode || '—' },
  { field: 'flightStartStationName',   headerName: 'Откуда',               flex: 1, minWidth: 150,
    valueGetter: (_v, row) => row.flightStartStationName || row.flightStartStationCode || '—' },
  { field: 'flightStartDate',          headerName: 'Дата отправки',        width: 130, valueFormatter: fmtDate },
  { field: 'dateArrivalAtDestination', headerName: 'Плановое прибытие',    width: 145, valueFormatter: fmtDate },
  { field: 'gngCode',                  headerName: 'Код ГНГ',              width: 100, valueFormatter: fmtStr },
  { field: 'cargoWeight',              headerName: 'Вес груза',            width: 100, valueFormatter: fmtTons },
  { field: 'waybillNumber',            headerName: 'Накладная',            width: 130, valueFormatter: fmtStr },
  { field: 'sendingNumber',            headerName: '№ отправки',           width: 120, valueFormatter: fmtStr },
  { field: 'shipperOkpo',              headerName: 'Отправитель ОКПО',     width: 150, valueFormatter: fmtStr },
  { field: 'consigneeOkpo',            headerName: 'Получатель ОКПО',      width: 150, valueFormatter: fmtStr },
  {
    field: 'containerNumbers', headerName: 'Контейнеры', width: 180, filterable: false, sortable: false,
    renderCell: ({ value }: GridRenderCellParams<WagonDto, string[]>) =>
      value && value.length > 0
        ? <Typography variant="caption" noWrap title={value.join(', ')}>{value.join(', ')}</Typography>
        : <Typography variant="caption" color="text.disabled">—</Typography>,
  },
  { field: 'numberLoadedContainers',   headerName: 'Конт. загруж.',        width: 115, valueFormatter: (v) => v ?? '—' },
  { field: 'numberEmptyContainers',    headerName: 'Конт. пустых',         width: 115, valueFormatter: (v) => v ?? '—' },
  { field: 'lastSeenAt',               headerName: 'Обновлён',             width: 130, valueFormatter: fmtDate },
];

const DEFAULT_VISIBLE: Record<string, boolean> = {
  _color: true,
  wagonNumber: true,
  wagonType: false,
  wagonPosition: true,
  stationName: true,
  operationName: true,
  remainingDistance: true,
  distanceTraveled: false,
  totalDistance: false,
  destinationStationName: true,
  flightStartStationName: false,
  flightStartDate: false,
  dateArrivalAtDestination: false,
  gngCode: false,
  cargoWeight: false,
  waybillNumber: false,
  sendingNumber: false,
  shipperOkpo: false,
  consigneeOkpo: false,
  containerNumbers: false,
  numberLoadedContainers: false,
  numberEmptyContainers: false,
  lastSeenAt: true,
  _comments: true,
};

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ px: 1, py: 0.5 }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
    </GridToolbarContainer>
  );
}

interface Props {
  trainNumber: string;
  trainIndex: string | null;
}

export default function WagonTable({ trainNumber, trainIndex }: Props) {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [colVisibility, setColVisibility] = useState(DEFAULT_VISIBLE);

  const { data: wagons = [], isLoading } = useQuery({
    queryKey: ['train-wagons', trainNumber, trainIndex],
    queryFn: () => trainsApi.getWagons(trainNumber, trainIndex),
  });

  const columns = useMemo<GridColDef<WagonDto>[]>(() => [
    ...STATIC_COLUMNS,
    {
      field: '_comments', headerName: 'Комм.', width: 70, sortable: false, filterable: false,
      renderCell: ({ row }) => row.activeTripId ? (
        <Tooltip title="Комментарии">
          <IconButton
            size="small"
            onClick={e => {
              e.stopPropagation();
              setSelectedTripId(prev => prev === row.activeTripId ? null : row.activeTripId);
            }}>
            <CommentIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null,
    },
  ], []);

  const incomingCount = wagons.filter(w => w.destinationStationCode === OUR_STATION).length;
  const arrivedCount  = wagons.filter(w => w.destinationStationCode === OUR_STATION && w.operationCode === '96').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, px: 2, py: 1, bgcolor: 'grey.50', flexWrap: 'wrap' }}>
        <Chip size="small" label={`Вагонов: ${wagons.length}`} />
        {arrivedCount > 0 && (
          <Chip size="small" label={`На нашей станции: ${arrivedCount}`}
            sx={{ bgcolor: '#f44336', color: '#fff' }} />
        )}
        {incomingCount - arrivedCount > 0 && (
          <Chip size="small" label={`К нам: ${incomingCount - arrivedCount}`}
            sx={{ bgcolor: '#4caf50', color: '#fff' }} />
        )}
      </Box>

      <DataGrid
        rows={wagons}
        columns={columns}
        loading={isLoading}
        autoHeight
        columnVisibilityModel={colVisibility}
        onColumnVisibilityModelChange={m => setColVisibility(m as typeof DEFAULT_VISIBLE)}
        filterMode="client"
        disableRowSelectionOnClick
        onRowClick={({ row }) => {
          const wagon = row as WagonDto;
          if (wagon.activeTripId) {
            setSelectedTripId(prev => prev === wagon.activeTripId ? null : wagon.activeTripId);
          }
        }}
        slots={{ toolbar: CustomToolbar }}
        sx={{
          border: 'none',
          borderTop: '1px solid',
          borderColor: 'divider',
          '& .MuiDataGrid-row': { cursor: 'default' },
          fontSize: 12,
        }}
        getRowClassName={({ row }) => row.activeTripId ? 'has-trip' : ''}
        density="compact"
      />

      <Collapse in={!!selectedTripId}>
        {selectedTripId && (
          <>
            <Divider />
            <CommentsPanel tripId={selectedTripId} onClose={() => setSelectedTripId(null)} />
          </>
        )}
      </Collapse>
    </Box>
  );
}
