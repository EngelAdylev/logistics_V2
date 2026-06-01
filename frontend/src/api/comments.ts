import apiClient from './client';

export interface TripCommentDto {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface AddCommentRequest {
  author: string;
  body: string;
}

export const commentsApi = {
  list: (tripId: string) =>
    apiClient.get<TripCommentDto[]>(`/trips/${tripId}/comments`).then(r => r.data),

  add: (tripId: string, req: AddCommentRequest) =>
    apiClient.post<TripCommentDto>(`/trips/${tripId}/comments`, req).then(r => r.data),
};
