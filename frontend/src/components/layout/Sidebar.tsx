'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/lib/hooks/useRole';

const navItems = [
  { href: '/', label: '🏠 Dashboard' },
  { href: '/projects', label: '📁 Projects' },
  { href: '/issues', label: '🐛 Issues' },
];

const adminItems = [{ href: '/admin/users', label: '⚙️ Admin Panel' }];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useRole();

  const items = isAdmin ? [...navItems, ...adminItems] : navItems;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">🚀 ProjectHub</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
              isActive(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}