'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/lib/hooks/useRole';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/projects', label: 'Projects', icon: '📁' },
  { href: '/issues', label: 'Issues', icon: '🐛' },
];

const adminItems = [
  { href: '/admin/users', label: 'Admin Panel', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isAdmin } = useRole();
  const router = useRouter();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const activeClass = 'bg-indigo-500/15 text-white border-l-2 border-indigo-400';
  const idleClass = 'text-slate-400 border-l-2 border-transparent hover:bg-slate-800/70 hover:text-white';

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">
            P
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">ProjectHub</h1>
            <p className="text-xs text-slate-500">Workspace</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider px-3 mb-1.5">
          Main Menu
        </p>
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-r-lg text-sm transition-colors ${
                isActive(item.href) ? activeClass : idleClass
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {isAdmin && (
          <>
            <div className="my-4 h-px bg-slate-800" />
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider px-3 mb-1.5">
              Admin
            </p>
            <div className="space-y-0.5">
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-r-lg text-sm transition-colors ${
                    isActive(item.href) ? activeClass : idleClass
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="group rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 p-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isAdmin ? 'bg-violet-500/20 text-violet-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 text-left text-xs text-slate-400 hover:text-red-400 transition-colors px-1 py-1 rounded md:opacity-0 md:group-hover:opacity-100"
          >
            → Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
