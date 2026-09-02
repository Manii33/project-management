import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f6f6fb] text-slate-800 dark:bg-[#0a0a0b] dark:text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 py-7 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}