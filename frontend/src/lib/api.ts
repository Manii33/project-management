import axios, { AxiosError } from 'axios';
import { showErrorToast } from './toast';

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const url = error.config?.url || '';
    console.error('API Error:', serverMessage || 'Something went wrong');

    // Auth pages apni inline errors dikhati hain — wahan toast noise nahi chahiye
    if (!url.startsWith('/auth/') && status) {
      let message = serverMessage || 'Something went wrong. Please try again.';
      if (status === 401) {
        message = 'Your session has expired. Please log in again.';
      } else if (status === 403 && message === 'Forbidden resource') {
        message = 'You do not have permission to perform this action (admin only).';
      }
      showErrorToast(message);
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError;
    if (data?.errors?.length) {
      return data.errors.join(', ');
    }
    return data?.message || 'Something went wrong';
  }
  return 'Something went wrong';
}

export default api;