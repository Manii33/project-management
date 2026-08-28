import axios, { AxiosError } from 'axios';
import { showErrorToast } from './toast';

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
}

// 401 handling: ek baar token clear + redirect, taake loop na ho
let isRedirecting = false;

function handleUnauthorized() {
  if (isRedirecting) return;
  if (typeof window === 'undefined') return;
  isRedirecting = true;
  localStorage.removeItem('token');
  const current = window.location.pathname;
  if (!current.startsWith('/login')) {
    const redirect = encodeURIComponent(current + (window.location.search || ''));
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- interceptor is outside component tree; full page nav intended
    window.location.href = `/login?redirect=${redirect}`;
  }
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

    // 401 = invalid/expired token -> clear + redirect (auth endpoints exclude
    // karo taake login flow khud na toot jaye)
    if (status === 401 && !url.startsWith('/auth/')) {
      handleUnauthorized();
      return Promise.reject(error);
    }

    // Auth pages apni inline errors dikhati hain — wahan toast noise nahi chahiye
    if (!url.startsWith('/auth/') && status) {
      let message = serverMessage || 'Something went wrong. Please try again.';
      if (status === 403 && message === 'Forbidden resource') {
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