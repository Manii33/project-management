import axios, { AxiosError } from 'axios';

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
    const url = error.config?.url || '';

    // 401 = invalid/expired token -> clear + redirect (auth endpoints exclude
    // karo taake login flow khud na toot jaye)
    if (status === 401 && !url.startsWith('/auth/')) {
      handleUnauthorized();
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || 'Something went wrong';
    console.error('API Error:', message);
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