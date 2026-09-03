'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ExportProvider } from '@/lib/export-context';
import { DateRangeProvider } from '@/lib/date-range-context';
import ErrorBoundary from './ErrorBoundary';
import Toaster from './ui/Toaster';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          retry: 1,
        },
        mutations: {
          onError: (error) => {
            console.error('Mutation error:', error);
          },
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DateRangeProvider>
            <ExportProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
              <Toaster />
            </ExportProvider>
          </DateRangeProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}