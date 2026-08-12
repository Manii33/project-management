'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function HomePage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/health')
      .then((res) => setHealth(res.data))
      .catch(() => setError('Backend se connect nahi ho pa raha'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Welcome to ProjectHub 🚀
        </h1>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Backend Status</h2>
          {loading && <LoadingSpinner size="sm" />}
          {error && <ErrorMessage message={error} />}
          {health && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-700 font-medium">Connected ✅</span>
              <span className="text-gray-400 text-sm ml-2">{health.timestamp}</span>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}