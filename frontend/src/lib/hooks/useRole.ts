import { useAuth } from '@/context/AuthContext';

export function useRole() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';
  return { isAdmin, isMember, role: user?.role };
}