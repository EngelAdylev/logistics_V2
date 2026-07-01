import apiClient from './client';

export interface WagonMapDto {
  id: string;
  wagonNumber: string;
  stationCode: string | null;
  stationName: string | null;
  lat: number;
  lng: number;
  remainingDistance: number | null;
  operationCode: string | null;
  trainNumber: string | null;
  trainIndex: string | null;
  destinationStationCode: string | null;
  activeTripId: string | null;
}

export interface WagonDto {
  id: string;
  wagonNumber: string;
  wagonType: string | null;
  stationCode: string | null;
  stationName: string | null;
  currentTrainNumber: string | null;
  currentTrainIndex: string | null;
  wagonPosition: number | null;
  remainingDistance: number | null;
  distanceTraveled: number | null;
  totalDistance: number | null;
  operationCode: string | null;
  operationName: string | null;
  lastSeenAt: string | null;
  flightStartStationCode: string | null;
  flightStartStationName: string | null;
  flightStartDate: string | null;
  destinationStationCode: string | null;
  destinationStationName: string | null;
  waybillNumber: string | null;
  sendingNumber: string | null;
  gngCode: string | null;
  shipperOkpo: string | null;
  consigneeOkpo: string | null;
  containerNumbers: string[] | null;
  numberLoadedContainers: number | null;
  numberEmptyContainers: number | null;
  cargoWeight: number | null;
  dateArrivalAtDestination: string | null;
  activeTripId: string | null;
}

export interface WagonFilter {
  wagonNumber?: string | null;
  trainNumber?: string | null;
  stationCode?: string | null;
  operationCode?: string | null;
  destinationStationCode?: string | null;
  hasContainers?: boolean | null;
}

export interface WagonPageRequest {
  filter?: WagonFilter;
  page?: number;
  size?: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const wagonsApi = {
  getForMap: () =>
    apiClient.get<WagonMapDto[]>('/wagons/map').then(r => r.data),

  // Тянем большой батч и фильтруем/группируем на клиенте (как в старой «Дислокации»)
  getPage: (req: WagonPageRequest = {}) =>
    apiClient
      .post<Page<WagonDto>>('/wagons/page', { page: 0, size: 10000, ...req })
      .then(r => r.data),
};
