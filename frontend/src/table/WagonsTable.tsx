import { useMemo, useState, useRef, Fragment, type ReactNode } from 'react';
import { Checkbox } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import type { WagonDto } from '../api/wagons';
import { COLUMNS, DEFAULT_ORDER, STORAGE_KEY_ORDER, STORAGE_KEY_GROUP, STORAGE_KEY_SORT } from './columns';
import ColumnFilter from './ColumnFilter';
import ColumnVisibilityPanel from './ColumnVisibilityPanel';
import {
  applyColumnFilters, buildGroups, cellText, formatDateTime,
  getVariant, VARIANT_COLOR, VARIANT_LABEL,
  type ColumnFilters, type WagonVariant, type GroupNode,
} from './tableUtils';

type SortDir = null | 'asc' | 'desc';

function load<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fallback; }
  catch { return fallback; }
}
function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

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
  onMapIds: Set<string>;
}

function StatusDot({ variant }: { variant: WagonVariant }) {
  return <span className="status-dot" title={VARIANT_LABEL[variant]} style={{ background: VARIANT_COLOR[variant] }} />;
}

export default function WagonsTable(props: Props) {
  const {
    data, columnFilters, onFilterChange, onResetFilters,
    visibleIds, onVisibilityChange, selected, onToggleOne, onSetMany, onOpenComments, onMapIds,
  } = props;

  const [sortDir, setSortDir] = useState<SortDir>(() => load<SortDir>(STORAGE_KEY_SORT, 'desc'));
  const [groupCols, setGroupCols] = useState<string[]>(() => load<string[]>(STORAGE_KEY_GROUP, []));
  const [order, setOrder] = useState<string[]>(() => load<string[]>(STORAGE_KEY_ORDER, DEFAULT_ORDER));
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dropHint, setDropHint] = useState(false);
  const dragCol = useRef<string | null>(null);

  const colById = useMemo(() => new Map(COLUMNS.map(c => [c.id, c])), []);

  // Полный порядок колонок (добавляем недостающие в конец, если появились новые)
  const effectiveOrder = useMemo(() => {
    const set = new Set(order);
    return [...order.filter(id => colById.has(id)), ...COLUMNS.map(c => c.id).filter(id => !set.has(id))];
  }, [order, colById]);

  // Колонки в теле: по порядку, видимые, кроме тех, по которым группируем
  const visibleCols = useMemo(
    () => effectiveOrder
      .filter(id => visibleIds.includes(id) && !groupCols.includes(id))
      .map(id => colById.get(id)!),
    [effectiveOrder, visibleIds, groupCols, colById],
  );

  const filtered = useMemo(() => applyColumnFilters(data, columnFilters, colById), [data, columnFilters, colById]);
  const sorted = useMemo(() => {
    if (!sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const ta = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
      const tb = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
      return sortDir === 'desc' ? tb - ta : ta - tb;
    });
  }, [filtered, sortDir]);

  const groups = useMemo(
    () => (groupCols.length ? buildGroups(sorted, groupCols, colById) : null),
    [groupCols, sorted, colById],
  );

  const allIds = useMemo(() => sorted.map(w => w.id), [sorted]);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id)) && !allSelected;
  const hasFilters = Object.values(columnFilters).some(v => v && v.length);
  const colSpan = visibleCols.length + 3;

  const cycleSort = () => setSortDir(d => {
    const next: SortDir = d === 'desc' ? 'asc' : d === 'asc' ? null : 'desc';
    save(STORAGE_KEY_SORT, next);
    return next;
  });
  const toggleCollapse = (path: string) => setCollapsed(prev => {
    const next = new Set(prev);
    next.has(path) ? next.delete(path) : next.add(path);
    return next;
  });
  const addGroup = (colId: string) => setGroupCols(prev => {
    if (prev.includes(colId)) return prev;
    const next = [...prev, colId];
    save(STORAGE_KEY_GROUP, next);
    return next;
  });
  const removeGroup = (colId: string) => setGroupCols(prev => {
    const next = prev.filter(c => c !== colId);
    save(STORAGE_KEY_GROUP, next);
    return next;
  });
  const reorder = (dragged: string, target: string) => {
    if (dragged === target) return;
    setOrder(() => {
      const base = effectiveOrder.filter(id => id !== dragged);
      const idx = base.indexOf(target);
      base.splice(idx, 0, dragged);
      save(STORAGE_KEY_ORDER, base);
      return base;
    });
  };

  const renderCell = (w: WagonDto, colId: string) => {
    if (colId === 'onMap') {
      const on = onMapIds.has(w.id);
      return <span className={`onmap-badge ${on ? 'onmap-yes' : 'onmap-no'}`}
        title={on ? 'Отображается на карте' : 'Нет на карте'}>{on ? '✓' : '✕'}</span>;
    }
    const col = colById.get(colId)!;
    if (col.key === 'lastSeenAt') return formatDateTime(w.lastSeenAt);
    return cellText(w, col) || '—';
  };

  const renderRow = (w: WagonDto, depth: number) => (
    <tr key={w.id} className={selected.has(w.id) ? 'row-selected' : ''}>
      <td className="sel-col" style={{ paddingLeft: 8 + depth * 18 }}>
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

  const renderGroupNodes = (nodes: GroupNode[], level: number): ReactNode =>
    nodes.map(node => {
      const isCollapsed = collapsed.has(node.path);
      const col = colById.get(node.colId);
      return (
        <Fragment key={node.path}>
          <tr className="group-row" onClick={() => toggleCollapse(node.path)}>
            <td colSpan={colSpan} style={{ paddingLeft: 10 + level * 18 }}>
              <span className="group-caret">
                {isCollapsed ? <ChevronRightIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
              </span>
              <span className="group-col-label">{col?.label}:</span>
              <span className="group-label">{node.value}</span>
              <span className="group-count">{node.count}</span>
            </td>
          </tr>
          {!isCollapsed && (node.children
            ? renderGroupNodes(node.children, level + 1)
            : node.rows!.map(w => renderRow(w, level + 1)))}
        </Fragment>
      );
    });

  return (
    <div className="wagons-table-wrap">
      {/* Панель группировки — перетащи сюда заголовок колонки */}
      <div className={`group-panel${dropHint ? ' drop-active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDropHint(true); }}
        onDragLeave={() => setDropHint(false)}
        onDrop={e => { e.preventDefault(); setDropHint(false); const id = dragCol.current; if (id) addGroup(id); }}>
        {groupCols.length === 0 ? (
          <span className="group-panel-hint">Перетащите сюда заголовок колонки, чтобы сгруппировать</span>
        ) : (
          <>
            <span className="group-panel-label">Группировка:</span>
            {groupCols.map(id => (
              <span key={id} className="group-chip">
                {colById.get(id)?.label}
                <button type="button" className="group-chip-x" onClick={() => removeGroup(id)} aria-label="Убрать">
                  <CloseIcon sx={{ fontSize: 13 }} />
                </button>
              </span>
            ))}
          </>
        )}
      </div>

      <div className="table-toolbar">
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
                <th key={col.id} style={{ minWidth: col.width }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const id = dragCol.current; if (id) reorder(id, col.id); }}>
                  <div className="th-inner">
                    <span className="th-grip" draggable
                      onDragStart={() => { dragCol.current = col.id; }}
                      onDragEnd={() => { dragCol.current = null; }}
                      title="Перетащить: в панель — группировка, на другую колонку — порядок">
                      <DragIndicatorIcon sx={{ fontSize: 14 }} />
                    </span>
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
            {!groups && sorted.map(w => renderRow(w, 0))}
            {groups && renderGroupNodes(groups, 0)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
