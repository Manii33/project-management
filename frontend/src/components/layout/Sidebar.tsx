'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/lib/hooks/useRole';
import Logo from '@/components/Logo';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/projects', label: 'Projects', icon: '📁' },
  { href: '/issues', label: 'Issues', icon: '🐛' },
];

const adminItems = [{ href: '/admin/users', label: 'Admin Panel', icon: '⚙️' }];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useRole();

  const items = isAdmin ? [...navItems, ...adminItems] : navItems;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-6 border-b border-gray-700">
        <Logo size={36} />
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] ${
              isActive(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}