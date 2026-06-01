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

export const wagonsApi = {
  getForMap: () =>
    apiClient.get<WagonMapDto[]>('/wagons/map').then(r => r.data),
};
