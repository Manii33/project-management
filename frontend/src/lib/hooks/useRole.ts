import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';

export function useRole() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isMember = user?.role === UserRole.MEMBER;
  return { isAdmin, isMember, role: user?.role };
}