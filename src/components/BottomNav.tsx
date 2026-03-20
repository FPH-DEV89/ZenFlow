'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderOpen, Plus, Calendar, Settings } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname() || '/';

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-lg border-t border-[var(--theme-primary)]/10 px-6 py-3 flex items-center justify-between z-50">
      <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-[var(--theme-primary)]' : 'text-slate-400'}`}>
        <Home size={24} className={pathname === '/' ? 'fill-current' : ''} />
        <span className="text-[10px] font-medium">Accueil</span>
      </Link>
      <Link href="/projects" className={`flex flex-col items-center gap-1 ${pathname === '/projects' ? 'text-[var(--theme-primary)]' : 'text-slate-400'}`}>
        <FolderOpen size={24} className={pathname === '/projects' ? 'fill-current' : ''} />
        <span className="text-[10px] font-medium">Projets</span>
      </Link>
      <div className="relative -top-8">
        <Link href="/new-task" className="w-14 h-14 bg-[var(--theme-primary)] rounded-full flex items-center justify-center text-white shadow-xl shadow-[var(--theme-primary)]/40 ring-4 ring-[#f8f5f8]">
          <Plus size={32} />
        </Link>
      </div>
      <Link href="/calendar" className={`flex flex-col items-center gap-1 ${pathname === '/calendar' ? 'text-[var(--theme-primary)]' : 'text-slate-400'}`}>
        <Calendar size={24} className={pathname === '/calendar' ? 'fill-current' : ''} />
        <span className="text-[10px] font-medium">Calendrier</span>
      </Link>
      <Link href="/settings" className={`flex flex-col items-center gap-1 ${pathname === '/settings' ? 'text-[var(--theme-primary)]' : 'text-slate-400'}`}>
        <Settings size={24} className={pathname === '/settings' ? 'fill-current' : ''} />
        <span className="text-[10px] font-medium">Paramètres</span>
      </Link>
    </nav>
  );
}
