import type { WagonDto } from '../api/wagons';
import type { ColumnDef } from './columns';

export const OUR_STATION = '648400';
export const EMPTY_TRAIN_LABEL = 'Без поезда';
export const EMPTY_DISTANCE_LABEL = 'Нет данных';

export type Direction = 'delivery' | 'dispatch' | 'archive' | 'all';
export type WagonVariant = 'arrived' | 'incoming' | 'other';

/** Цветовой статус вагона (как на карте/поездах). */
export function getVariant(w: WagonDto): WagonVariant {
  if (w.destinationStationCode === OUR_STATION) {
    if (w.operationCode === '96') return 'arrived';
    if (w.operationCode === '20' && w.stationCode === OUR_STATION) return 'arrived';
    return 'incoming';
  }
  return 'other';
}

export const VARIANT_COLOR: Record<WagonVariant, string> = {
  arrived: '#ef4444',
  incoming: '#22c55e',
  other: '#3b82f6',
};

export const VARIANT_LABEL: Record<WagonVariant, string> = {
  arrived: 'На нашей станции',
  incoming: 'Едет к нам',
  other: 'Прочие',
};

/** Отбор по субфильтру направления. */
export function matchesDirection(w: WagonDto, dir: Direction): boolean {
  const active = w.activeTripId != null;
  switch (dir) {
    // Поставка/Отправка — только активные рейсы; завершённые уходят в «Архивные»
    case 'delivery': return active && w.destinationStationCode === OUR_STATION;
    case 'dispatch': return active && w.flightStartStationCode === OUR_STATION;
    case 'archive':  return !active;
    case 'all':      return true;
    default:         return true;
  }
}

/** Строковое представление ячейки для отображения. */
export function cellText(w: WagonDto, col: ColumnDef): string {
  if (col.key === 'containerNumbers') {
    const arr = w.containerNumbers;
    return arr && arr.length ? arr.join(', ') : '';
  }
  if (!col.key) return '';
  const v = w[col.key];
  if (v == null) return '';
  return String(v);
}

/** Значение ячейки для фильтрации (пустое → метка). */
export function filterValue(w: WagonDto, col: ColumnDef): string {
  const t = cellText(w, col).trim();
  return t || EMPTY_TRAIN_LABEL;
}

/** Уникальные значения колонки для попапа фильтра. */
export function uniqueValues(rows: WagonDto[], col: ColumnDef): string[] {
  const set = new Set<string>();
  for (const r of rows) set.add(filterValue(r, col));
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, 'ru', { numeric: true }),
  );
}

export type ColumnFilters = Record<string, string[]>;

/** Применяет активные фильтры колонок. */
export function applyColumnFilters(
  rows: WagonDto[],
  filters: ColumnFilters,
  colById: Map<string, ColumnDef>,
): WagonDto[] {
  const active = Object.entries(filters).filter(([, v]) => v && v.length);
  if (!active.length) return rows;
  return rows.filter(row =>
    active.every(([colId, vals]) => {
      const col = colById.get(colId);
      if (!col) return true;
      return vals.includes(filterValue(row, col));
    }),
  );
}

/** Поиск по номеру вагона (мультитокен через пробел/запятую). */
export function applyWagonSearch(rows: WagonDto[], search: string): WagonDto[] {
  const tokens = search.toLowerCase().split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
  if (!tokens.length) return rows;
  return rows.filter(w => {
    const n = (w.wagonNumber || '').toLowerCase();
    return tokens.some(t => n.includes(t));
  });
}

export function trainGroupKey(w: WagonDto): string {
  const v = (w.currentTrainNumber || '').trim();
  return v || EMPTY_TRAIN_LABEL;
}

export function groupByTrain(rows: WagonDto[]): Map<string, WagonDto[]> {
  const m = new Map<string, WagonDto[]>();
  for (const r of rows) {
    const k = trainGroupKey(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  return m;
}

export function distanceGroupKey(w: WagonDto): string {
  return w.remainingDistance == null ? EMPTY_DISTANCE_LABEL : `${w.remainingDistance} км`;
}

export function groupByDistance(rows: WagonDto[]): Map<string, WagonDto[]> {
  const m = new Map<string, WagonDto[]>();
  for (const r of rows) {
    const k = distanceGroupKey(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  return new Map(
    [...m.entries()].sort((a, b) => {
      if (a[0] === EMPTY_DISTANCE_LABEL) return 1;
      if (b[0] === EMPTY_DISTANCE_LABEL) return -1;
      return (parseFloat(a[0]) || 0) - (parseFloat(b[0]) || 0);
    }),
  );
}

export function formatDateTime(v: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}
