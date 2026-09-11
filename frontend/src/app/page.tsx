'use client';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 break-words">
            Welcome, {user?.name}! 👋
          </h1>
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <h2 className="font-semibold text-gray-700 mb-4">Your Account</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="break-words"><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Role:</span> {user?.role}</p>
              <p className="break-words"><span className="font-medium">ID:</span> {user?.id}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}