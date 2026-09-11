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
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ExportProvider>
          <DateRangeProvider>
            <AuthProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
              <Toaster />
            </AuthProvider>
          </DateRangeProvider>
        </ExportProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}