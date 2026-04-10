'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface HeaderProps {
  alertCount?: number;
  userEmail?: string;
}

export function Header({ alertCount = 0, userEmail }: HeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="fixed top-0 right-0 left-60 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
      <div className="flex items-center gap-2">
        {/* Global search placeholder */}
        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-500 transition-colors">
          <span>🔍</span>
          <span>Buscar</span>
          <kbd className="hidden sm:inline-flex ml-2 text-[10px] bg-white border border-gray-300 rounded px-1 py-0.5">⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Alert bell */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Alertas">
          <span>🔔</span>
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-7 h-7 bg-criteria-100 rounded-full flex items-center justify-center">
            <span className="text-criteria-700 font-medium text-xs">
              {userEmail ? userEmail[0].toUpperCase() : 'A'}
            </span>
          </div>
          {userEmail && (
            <span className="hidden sm:block text-sm text-gray-700 max-w-[160px] truncate">
              {userEmail}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="ml-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            title="Cerrar sesión"
          >
            ⎋
          </button>
        </div>
      </div>
    </header>
  );
}
