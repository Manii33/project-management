'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { formatDateRange } from '@/lib/date';
import ExportDropdown from '@/components/layout/ExportDropdown';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/projects': 'Projects',
  '/issues': 'Issues',
  '/admin': 'Admin Panel',
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const isDark = theme === 'dark';

  const title =
    Object.entries(PAGE_TITLES).find(([key]) =>
      key === '/' ? pathname === '/' : pathname.startsWith(key)
    )?.[1] || 'ProjectHub';

  const isHome = pathname === '/';

  return (
    <header className="h-14 shrink-0 border-b border-violet-100/80 bg-white/80 backdrop-blur flex items-center justify-between px-6 lg:px-8 dark:border-zinc-800/80 dark:bg-[#0a0a0b]/95">
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link
          href="/"
          className={`transition-colors ${isHome ? 'text-violet-700 font-semibold dark:text-zinc-100' : 'text-slate-400 hover:text-violet-600 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
        >
          {isHome ? 'Overview' : 'Home'}
        </Link>
        {!isHome && (
          <>
            <span className="text-violet-200 dark:text-zinc-700">/</span>
            <Link href={pathname} className="text-slate-800 font-semibold dark:text-zinc-100">
              {title}
            </Link>
          </>
        )}
      </nav>

      <div className="flex items-center gap-2">
        <span className="hidden lg:inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 bg-white border border-slate-200/80 rounded-xl px-3 h-9 shadow-sm dark:border-zinc-800">
          <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {formatDateRange()}
        </span>

        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex items-center justify-center w-9 h-9 text-sm text-slate-500 dark:text-zinc-300 bg-white border border-slate-200/80 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-colors shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>

        {isHome && <ExportDropdown />}

        <button
          onClick={() => router.push(isHome ? '/projects' : '/issues')}
          className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl px-3.5 h-9 transition-colors shadow-md shadow-indigo-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden md:inline">New Issue</span>
        </button>

        <div className="flex items-center rounded-xl bg-white border border-slate-200/80 shadow-sm h-9 dark:bg-zinc-900/70 dark:border-zinc-800">
          <div className="hidden md:flex items-center gap-2.5 pl-2 pr-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-300">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight hidden lg:block">
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-100">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            title="Sign out"
            className="inline-flex items-center justify-center w-9 h-9 text-slate-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}