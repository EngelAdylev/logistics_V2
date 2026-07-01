import { useMemo, useState, type MouseEvent } from 'react';
import { Popover, TextField, Checkbox, InputAdornment } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import type { WagonDto } from '../api/wagons';
import type { ColumnDef } from './columns';
import { uniqueValues } from './tableUtils';

interface Props {
  col: ColumnDef;
  rows: WagonDto[];
  active: string[] | undefined;
  onApply: (vals: string[]) => void;
  onClear: () => void;
}

export default function ColumnFilter({ col, rows, active, onApply, onClear }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const options = useMemo(() => uniqueValues(rows, col), [rows, col]);
  const hasActive = !!active?.length;

  const open = (e: MouseEvent<HTMLElement>) => {
    setSelected(new Set(active || []));
    setSearch('');
    setAnchor(e.currentTarget);
  };
  const close = () => setAnchor(null);

  const shown = search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (val: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });

  return (
    <>
      <button
        type="button"
        className={`col-filter-btn${hasActive ? ' active' : ''}`}
        onClick={open}
        title={`Фильтр: ${col.label}`}
      >
        <FilterAltIcon sx={{ fontSize: 14 }} />
        {hasActive && <span className="col-filter-badge">{active!.length}</span>}
      </button>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { className: 'col-filter-popover' } }}
      >
        <div className="cf-search">
          <TextField
            autoFocus
            size="small"
            fullWidth
            placeholder="Поиск…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16 }} />
                </InputAdornment>
              ),
            }}
          />
        </div>

        <div className="cf-options">
          {shown.length === 0 ? (
            <div className="cf-empty">Ничего не найдено</div>
          ) : (
            shown.map(opt => (
              <label key={opt} className="cf-option">
                <Checkbox size="small" checked={selected.has(opt)} onChange={() => toggle(opt)} sx={{ p: 0.5 }} />
                <span className="cf-option-label" title={opt}>{opt}</span>
              </label>
            ))
          )}
        </div>

        <div className="cf-actions">
          <button type="button" className="cf-btn" onClick={() => { onClear(); close(); }}>
            Сбросить
          </button>
          <button type="button" className="cf-btn" onClick={() => setSelected(new Set(shown))}>
            Все
          </button>
          <button
            type="button"
            className="cf-btn cf-btn--primary"
            onClick={() => { onApply(Array.from(selected)); close(); }}
          >
            OK
          </button>
        </div>
      </Popover>
    </>
  );
}
