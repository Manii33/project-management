'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/issues': 'Issues',
  '/admin': 'Admin Panel',
};

export default function Header() {
  const pathname = usePathname();

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    key === '/' ? pathname === '/' : pathname.startsWith(key)
  )?.[1] || 'ProjectHub';

  const isHome = pathname === '/';

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 dark:bg-slate-800 dark:border-slate-700">
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link
          href="/"
          className={`transition-colors ${isHome ? 'text-gray-900 font-semibold dark:text-slate-100' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300'}`}
        >
          Home
        </Link>
        {!isHome && (
          <>
            <span className="text-slate-300 dark:text-slate-500">/</span>
            <span className="text-gray-900 font-semibold dark:text-slate-100">{title}</span>
          </>
        )}
      </nav>
    </header>
  );
}
