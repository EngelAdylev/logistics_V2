import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, CircularProgress, Alert, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ChatIcon from '@mui/icons-material/Chat';
import { IconButton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { wagonsApi, type WagonDto } from '../api/wagons';
import { commentsApi } from '../api/comments';
import WagonsTable from '../table/WagonsTable';
import CommentsDrawer from '../components/CommentsDrawer';
import { DEFAULT_VISIBLE_IDS, STORAGE_KEY_COLUMNS } from '../table/columns';
import {
  matchesDirection, applyWagonSearch, type Direction, type ColumnFilters,
} from '../table/tableUtils';

const DIRECTIONS: { id: Direction; label: string }[] = [
  { id: 'delivery', label: 'Поставка' },
  { id: 'dispatch', label: 'Отправка' },
  { id: 'lkds', label: 'ЛКДС' },
  { id: 'archive', label: 'Архивные' },
  { id: 'all', label: 'Все' },
];

function loadVisible(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COLUMNS);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p) && p.length) return p; }
  } catch { /* ignore */ }
  return DEFAULT_VISIBLE_IDS;
}

export default function DislocationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [direction, setDirection] = useState<Direction>('delivery');
  const [search, setSearch] = useState('');

  // Переход с карты: /dislocation?wagon=NUMBER → показываем этот вагон
  useEffect(() => {
    const w = searchParams.get('wagon');
    if (w) {
      setSearch(w);
      setDirection('all');
      searchParams.delete('wagon');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [visibleIds, setVisibleIds] = useState<string[]>(loadVisible);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [commentWagon, setCommentWagon] = useState<WagonDto | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['wagons-page'],
    queryFn: () => wagonsApi.getPage(),
    refetchInterval: 60_000,
  });

  // Точный набор вагонов, реально попадающих на карту (тот же источник, что и карта)
  const { data: mapData } = useQuery({
    queryKey: ['wagons-map-ids'],
    queryFn: wagonsApi.getForMap,
    refetchInterval: 60_000,
  });
  const onMapIds = useMemo(() => new Set((mapData ?? []).map(w => w.id)), [mapData]);

  const wagons = useMemo(() => data?.content ?? [], [data]);

  const counts = useMemo(() => {
    let active = 0, archived = 0;
    for (const w of wagons) (w.activeTripId ? active++ : archived++);
    return { active, archived };
  }, [wagons]);

  const rows = useMemo(() => {
    const byDir = wagons.filter(w => matchesDirection(w, direction));
    return applyWagonSearch(byDir, search);
  }, [wagons, direction, search]);

  const changeVisible = (ids: string[]) => {
    // сохраняем порядок как в COLUMNS через фильтрацию на стороне таблицы
    setVisibleIds(ids);
    try { localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(ids)); } catch { /* ignore */ }
  };

  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const setMany = (ids: string[], value: boolean) =>
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => (value ? next.add(id) : next.delete(id)));
      return next;
    });

  const selectedWagons = useMemo(
    () => wagons.filter(w => selected.has(w.id)),
    [wagons, selected],
  );

  const applyBulk = async () => {
    setBulkBusy(true);
    setBulkResult(null);
    let ok = 0;
    for (const w of selectedWagons) {
      try {
        await commentsApi.add(w.id, { body: bulkText.trim() });
        ok++;
      } catch { /* skip failures */ }
    }
    setBulkBusy(false);
    setBulkResult(`Добавлено: ${ok} из ${selectedWagons.length}`);
    setBulkText('');
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;
  }
  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={() => refetch()}>Повторить</Button>}>
        Не удалось загрузить вагоны
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" fontWeight={700}>Дислокация</Typography>
        <div className="seg-toggle">
          {DIRECTIONS.map(d => (
            <button key={d.id} type="button"
              className={`seg-btn${direction === d.id ? ' active' : ''}`}
              onClick={() => setDirection(d.id)}>
              {d.label}
            </button>
          ))}
        </div>

        <TextField
          size="small" placeholder="Поиск по всем полям — вставь список КТК/вагонов…"
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 320 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" edge="end" onClick={() => setSearch('')} aria-label="Очистить">
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <Box sx={{ flex: 1 }} />

        <Chip size="small" label={`Активных: ${counts.active}`}
          sx={{ bgcolor: '#e8f5e9', color: '#1b5e20', fontWeight: 600 }} />
        <Chip size="small" label={`Архивных: ${counts.archived}`}
          sx={{ bgcolor: '#eceff1', color: '#455a64', fontWeight: 600 }} />

        {selected.size > 0 && (
          <Button size="small" variant="contained" startIcon={<ChatIcon />}
            onClick={() => { setBulkResult(null); setBulkOpen(true); }}>
            Комментарий ({selected.size})
          </Button>
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <WagonsTable
          data={rows}
          columnFilters={columnFilters}
          onFilterChange={(colId, vals) => setColumnFilters(p => ({ ...p, [colId]: vals }))}
          onResetFilters={() => setColumnFilters({})}
          visibleIds={visibleIds}
          onVisibilityChange={changeVisible}
          selected={selected}
          onToggleOne={toggleOne}
          onSetMany={setMany}
          onOpenComments={setCommentWagon}
          onMapIds={onMapIds}
        />
      </Box>

      <CommentsDrawer wagon={commentWagon} onClose={() => setCommentWagon(null)} />

      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Комментарий к {selected.size} вагон(ам)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Комментарий добавится в историю каждого выбранного вагона от вашего имени.
          </Typography>
          <TextField
            fullWidth multiline minRows={3} autoFocus
            placeholder="Текст комментария…"
            value={bulkText} onChange={e => setBulkText(e.target.value)}
          />
          {bulkResult && <Alert severity="success" sx={{ mt: 2 }}>{bulkResult}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkOpen(false)}>Закрыть</Button>
          <Button variant="contained" disabled={!bulkText.trim() || bulkBusy} onClick={applyBulk}>
            {bulkBusy ? 'Отправка…' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
