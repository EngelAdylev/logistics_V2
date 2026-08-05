import apiClient from './client';

export interface WagonCommentDto {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface AddCommentRequest {
  body: string;
}

export const commentsApi = {
  list: (wagonId: string) =>
    apiClient.get<WagonCommentDto[]>(`/wagons/${wagonId}/comments`).then(r => r.data),

  add: (wagonId: string, req: AddCommentRequest) =>
    apiClient.post<WagonCommentDto>(`/wagons/${wagonId}/comments`, req).then(r => r.data),
};
