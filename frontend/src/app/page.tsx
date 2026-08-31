'use client';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { useRole } from '@/lib/hooks/useRole';

export default function HomePage() {
  const { user } = useAuth();
  const { isAdmin } = useRole();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, <span className="text-blue-600">{user?.name}</span> 👋
            </h1>
            <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening in your workspace.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-sm">
              <p className="text-blue-100 text-sm font-medium">Role</p>
              <p className="text-2xl font-bold mt-1 capitalize">{user?.role}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-sm">
              <p className="text-purple-100 text-sm font-medium">Status</p>
              <p className="text-2xl font-bold mt-1">Active</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-sm">
              <p className="text-green-100 text-sm font-medium">Access</p>
              <p className="text-2xl font-bold mt-1">{isAdmin ? 'Full' : 'Member'}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-sm">
              <p className="text-orange-100 text-sm font-medium">Theme</p>
              <p className="text-2xl font-bold mt-1">Light</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
            <Link href="/projects" className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <span className="text-2xl">📁</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Projects</h3>
              <p className="text-gray-400 text-sm">View and manage all projects</p>
            </Link>

            <Link href="/issues" className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-green-300 transition-all group">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                <span className="text-2xl">🐛</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">My Issues</h3>
              <p className="text-gray-400 text-sm">Track your assigned issues</p>
            </Link>

            {isAdmin && (
              <Link href="/projects" className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                  <span className="text-2xl">➕</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">New Project</h3>
                <p className="text-gray-400 text-sm">Create a new project</p>
              </Link>
            )}
          </div>

          {/* Account Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span>👤</span> Account Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-sm font-medium text-gray-800">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium text-gray-800">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Role</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">ID</span>
                <span className="text-xs font-mono text-gray-400">{user?.id}</span>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}