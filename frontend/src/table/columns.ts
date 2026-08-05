import type { WagonDto } from '../api/wagons';

export interface ColumnDef {
  id: string;
  label: string;
  /** Ключ поля WagonDto (или null для служебных колонок). */
  key: keyof WagonDto | null;
  filterable: boolean;
  required: boolean;      // нельзя скрыть
  defaultVisible: boolean;
  align?: 'left' | 'right' | 'center';
  width?: number;
}

export const COLUMNS: ColumnDef[] = [
  { id: 'currentTrainNumber',      label: '№ поезда',          key: 'currentTrainNumber',      filterable: true,  required: false, defaultVisible: true,  width: 96 },
  { id: 'currentTrainIndex',       label: 'Индекс',            key: 'currentTrainIndex',       filterable: true,  required: false, defaultVisible: true,  width: 130 },
  { id: 'wagonNumber',             label: 'Вагон',             key: 'wagonNumber',             filterable: true,  required: true,  defaultVisible: true,  width: 110 },
  { id: 'onMap',                   label: 'На карте',          key: null,                      filterable: false, required: false, defaultVisible: true,  align: 'center', width: 80 },
  { id: 'stationName',             label: 'Станция операции',  key: 'stationName',             filterable: true,  required: false, defaultVisible: true,  width: 180 },
  { id: 'operationName',           label: 'Операция',          key: 'operationName',           filterable: true,  required: false, defaultVisible: true,  width: 220 },
  { id: 'loadState',               label: 'Груж/пор',          key: null,                      filterable: true,  required: false, defaultVisible: true,  align: 'center', width: 80 },
  { id: 'lastSeenAt',              label: 'Время операции',    key: 'lastSeenAt',              filterable: false, required: false, defaultVisible: true,  width: 150 },
  { id: 'remainingDistance',       label: 'Остаток, км',       key: 'remainingDistance',       filterable: true,  required: false, defaultVisible: true,  align: 'right', width: 100 },
  { id: 'remainingMileage',        label: 'Остаток пробега',   key: 'remainingMileage',        filterable: true,  required: false, defaultVisible: false, align: 'right', width: 120 },
  { id: 'waybillNumber',           label: '№ накладной',       key: 'waybillNumber',           filterable: true,  required: false, defaultVisible: true,  width: 130 },
  { id: 'destinationStationName',  label: 'Ст. назначения',    key: 'destinationStationName',  filterable: true,  required: false, defaultVisible: false, width: 180 },
  { id: 'flightStartStationName',  label: 'Ст. отправления',   key: 'flightStartStationName',  filterable: true,  required: false, defaultVisible: false, width: 180 },
  { id: 'wagonType',               label: 'Модель вагона',     key: 'wagonType',               filterable: true,  required: false, defaultVisible: false, width: 130 },
  { id: 'containerNumbers',        label: '№ КТК',             key: 'containerNumbers',        filterable: false, required: false, defaultVisible: false, width: 160 },
  { id: 'cargoWeight',             label: 'Вес, кг',           key: 'cargoWeight',             filterable: true,  required: false, defaultVisible: false, align: 'right', width: 100 },
  { id: 'shipperOkpo',             label: 'Отправитель ОКПО',  key: 'shipperOkpo',             filterable: true,  required: false, defaultVisible: false, width: 130 },
  { id: 'consigneeOkpo',           label: 'Получатель ОКПО',   key: 'consigneeOkpo',           filterable: true,  required: false, defaultVisible: false, width: 130 },
];

export const DEFAULT_VISIBLE_IDS = COLUMNS.filter(c => c.defaultVisible).map(c => c.id);
export const DEFAULT_ORDER = COLUMNS.map(c => c.id);
export const STORAGE_KEY_COLUMNS = 'dislocation_visible_columns';
export const STORAGE_KEY_ORDER = 'dislocation_column_order';
export const STORAGE_KEY_GROUP = 'dislocation_group_cols';
export const STORAGE_KEY_SORT = 'dislocation_sort';
