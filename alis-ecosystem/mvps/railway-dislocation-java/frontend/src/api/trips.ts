import apiClient from './client';
import type { TripStatus } from './types';

export interface TripDto {
  id: string;
  wagonNumber: string | null;
  depStationCode: string | null;
  depStationName: string | null;
  dstStationCode: string | null;
  dstStationName: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: TripStatus;
}

export interface TripEventDto {
  id: string;
  stationCode: string | null;
  operationCode: string | null;
  operationName: string | null;
  operationDatetime: string | null;
  remainingDistance: number | null;
  trainNumber: string | null;
  containerNumbers: string[] | null;
}

export const tripsApi = {
  getPage: (params: { filter?: object; page?: number; size?: number }) =>
    apiClient.post<{ content: TripDto[]; totalElements: number }>('/trips/page', params).then(r => r.data),

  getById: (id: string) =>
    apiClient.get<TripDto>(`/trips/${id}`).then(r => r.data),

  getEvents: (id: string) =>
    apiClient.get<TripEventDto[]>(`/trips/${id}/events`).then(r => r.data),
};
