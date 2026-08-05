import axios from 'axios';
import { navigateTo } from './navigationRef';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  r => r,
  err => {
    const status = err?.response?.status;
    const url: string = err?.config?.url ?? '';
    // Токен протух/невалиден — чистим и уводим на логин (кроме самого логина)
    if ((status === 401 || status === 403) && !url.includes('/auth/login')) {
      localStorage.removeItem('auth');
      localStorage.removeItem('access_token');
      if (!window.location.pathname.endsWith('/login')) navigateTo('/login');
    }
    return Promise.reject(err);
  }
);

export default apiClient;
