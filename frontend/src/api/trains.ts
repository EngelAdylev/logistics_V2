import apiClient from './client';
import type { WagonDto } from './wagons';

export interface TrainSummaryDto {
  trainNumber: string;
  trainIndex: string | null;
  wagonCount: number;
  avgRemainingDistance: number | null;
  arrivedCount: number;
  incomingCount: number;
  otherCount: number;
}

export const trainsApi = {
  getAll: () =>
    apiClient.get<TrainSummaryDto[]>('/trains').then(r => r.data),

  getWagons: (trainNumber: string, trainIndex: string | null) => {
    const params = trainIndex ? { trainIndex } : {};
    return apiClient
      .get<WagonDto[]>(`/trains/${encodeURIComponent(trainNumber)}/wagons`, { params })
      .then(r => r.data);
  },
};
