import apiClient from './client';

export interface WagonMapDto {
  id: string;
  wagonNumber: string;
  lat: number;
  lng: number;
  remainingDistance: number | null;
  operationCode: string | null;
  trainNumber: string | null;
  destinationStationCode: string | null;
  activeTripId: string | null;
}

export interface WagonDto {
  id: string;
  wagonNumber: string;
  stationCode: string | null;
  stationName: string | null;
  currentTrainNumber: string | null;
  remainingDistance: number | null;
  operationCode: string | null;
  operationName: string | null;
  lastSeenAt: string | null;
  destinationStationCode: string | null;
  containerNumbers: string[] | null;
  cargoWeight: number | null;
  dateArrivalAtDestination: string | null;
  activeTripId: string | null;
}

export const wagonsApi = {
  getForMap: () =>
    apiClient.get<WagonMapDto[]>('/wagons/map').then(r => r.data),

  getPage: (params: { filter?: object; page?: number; size?: number }) =>
    apiClient.post<{ content: WagonDto[]; totalElements: number }>('/wagons/page', params).then(r => r.data),

  getById: (id: string) =>
    apiClient.get<WagonDto>(`/wagons/${id}`).then(r => r.data),
};
