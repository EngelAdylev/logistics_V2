import { useMemo, useState, Fragment } from 'react';
import { Checkbox } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LayersIcon from '@mui/icons-material/Layers';
import StraightenIcon from '@mui/icons-material/Straighten';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { WagonDto } from '../api/wagons';
import { COLUMNS } from './columns';
import ColumnFilter from './ColumnFilter';
import ColumnVisibilityPanel from './ColumnVisibilityPanel';
import {
  applyColumnFilters, groupByTrain, groupByDistance, cellText, formatDateTime,
  getVariant, VARIANT_COLOR, VARIANT_LABEL, type ColumnFilters, type WagonVariant,
} from './tableUtils';

type SortDir = null | 'asc' | 'desc';
type GroupMode = 'none' | 'train' | 'distance';

interface Props {
  data: WagonDto[];
  columnFilters: ColumnFilters;
  onFilterChange: (colId: string, vals: string[]) => void;
  onResetFilters: () => void;
  visibleIds: string[];
  onVisibilityChange: (ids: string[]) => void;
  selected: Set<string>;
  onToggleOne: (id: string) => void;
  onSetMany: (ids: string[], value: boolean) => void;
  onOpenComments: (w: WagonDto) => void;
}

function StatusDot({ variant }: { variant: WagonVariant }) {
  return (
    <span className="status-dot" title={VARIANT_LABEL[variant]}
      style={{ background: VARIANT_COLOR[variant] }} />
  );
}

export default function WagonsTable(props: Props) {
  const {
    data, columnFilters, onFilterChange, onResetFilters,
    visibleIds, onVisibilityChange, selected, onToggleOne, onSetMany, onOpenComments,
  } = props;

  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [group, setGroup] = useState<GroupMode>('none');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const colById = useMemo(() => new Map(COLUMNS.map(c => [c.id, c])), []);
  const visibleCols = useMemo(
    () => COLUMNS.filter(c => visibleIds.includes(c.id)),
    [visibleIds],
  );

  const filtered = useMemo(
    () => applyColumnFilters(data, columnFilters, colById),
    [data, columnFilters, colById],
  );

  const sorted = useMemo(() => {
    if (!sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const ta = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
      const tb = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
      return sortDir === 'desc' ? tb - ta : ta - tb;
    });
  }, [filtered, sortDir]);

  const groups = useMemo(() => {
    if (group === 'train') return groupByTrain(sorted);
    if (group === 'distance') return groupByDistance(sorted);
    return null;
  }, [group, sorted]);

  const allIds = useMemo(() => sorted.map(w => w.id), [sorted]);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id)) && !allSelected;
  const hasFilters = Object.values(columnFilters).some(v => v && v.length);

  const cycleSort = () =>
    setSortDir(d => (d === 'desc' ? 'asc' : d === 'asc' ? null : 'desc'));

  const toggleCollapse = (key: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const colSpan = visibleCols.length + 3; // select + dot + comment

  const renderCell = (w: WagonDto, colId: string) => {
    const col = colById.get(colId)!;
    if (col.key === 'lastSeenAt') return formatDateTime(w.lastSeenAt);
    const t = cellText(w, col);
    return t || '—';
  };

  const renderRow = (w: WagonDto, indent = false) => (
    <tr key={w.id} className={selected.has(w.id) ? 'row-selected' : ''}>
      <td className={`sel-col${indent ? ' indent' : ''}`}>
        <Checkbox size="small" checked={selected.has(w.id)} onChange={() => onToggleOne(w.id)} sx={{ p: 0.25 }} />
      </td>
      <td className="dot-col"><StatusDot variant={getVariant(w)} /></td>
      {visibleCols.map(col => (
        <td key={col.id} style={{ textAlign: col.align || 'left' }}
          className={col.id === 'wagonNumber' ? 'mono strong' : ''}>
          {renderCell(w, col.id)}
        </td>
      ))}
      <td className="chat-col">
        <button type="button" className="chat-btn" title="Комментарии" onClick={() => onOpenComments(w)}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="wagons-table-wrap">
      <div className="table-toolbar">
        <button type="button" className={`toolbar-btn${group === 'train' ? ' active' : ''}`}
          onClick={() => setGroup(g => (g === 'train' ? 'none' : 'train'))}>
          <LayersIcon sx={{ fontSize: 18 }} /> По поезду
        </button>
        <button type="button" className={`toolbar-btn${group === 'distance' ? ' active' : ''}`}
          onClick={() => setGroup(g => (g === 'distance' ? 'none' : 'distance'))}>
          <StraightenIcon sx={{ fontSize: 18 }} /> По остатку
        </button>
        <ColumnVisibilityPanel visibleIds={visibleIds} onChange={onVisibilityChange} />
        <button type="button" className="toolbar-btn" onClick={onResetFilters} disabled={!hasFilters}>
          <FilterAltOffIcon sx={{ fontSize: 18 }} /> Сбросить фильтры
        </button>
        <div className="toolbar-spacer" />
        <span className="toolbar-count">Показано: {sorted.length}</span>
      </div>

      <div className="table-scroll">
        <table className="wagons-table">
          <thead>
            <tr>
              <th className="sel-col">
                <Checkbox size="small" checked={allSelected} indeterminate={someSelected}
                  onChange={() => onSetMany(allIds, !allSelected)} sx={{ p: 0.25 }} />
              </th>
              <th className="dot-col" />
              {visibleCols.map(col => (
                <th key={col.id} style={{ minWidth: col.width }}>
                  <div className="th-inner">
                    <span className="th-label">{col.label}</span>
                    {col.id === 'lastSeenAt' && (
                      <button type="button" className={`sort-btn${sortDir ? ' active' : ''}`} onClick={cycleSort}
                        title="Сортировка по времени">
                        {sortDir === 'desc' ? <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                          : sortDir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                          : <UnfoldMoreIcon sx={{ fontSize: 14 }} />}
                      </button>
                    )}
                    {col.filterable && (
                      <ColumnFilter col={col} rows={data}
                        active={columnFilters[col.id]}
                        onApply={vals => onFilterChange(col.id, vals)}
                        onClear={() => onFilterChange(col.id, [])} />
                    )}
                  </div>
                </th>
              ))}
              <th className="chat-col" />
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={colSpan} className="empty-row">Нет данных</td></tr>
            )}

            {group === 'none' && sorted.map(w => renderRow(w))}

            {groups && Array.from(groups.entries()).map(([key, rows]) => {
              const isCollapsed = collapsed.has(key);
              const label = group === 'train' && key !== 'Без поезда' ? `Поезд ${key}` : key;
              return (
                <Fragment key={key}>
                  <tr className="group-row" onClick={() => toggleCollapse(key)}>
                    <td colSpan={colSpan}>
                      <span className="group-caret">
                        {isCollapsed ? <ChevronRightIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                      </span>
                      <span className="group-label">{label}</span>
                      <span className="group-count">{rows.length}</span>
                    </td>
                  </tr>
                  {!isCollapsed && rows.map(w => renderRow(w, true))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
