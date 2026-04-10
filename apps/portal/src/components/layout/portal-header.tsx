'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface PortalHeaderProps {
  user: { name: string; email: string };
}

export default function PortalHeader({ user }: PortalHeaderProps) {
  const router = useRouter();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [brujulaOpen, setBrujulaOpen] = useState(false);
  const [campanaOpen, setCampanaOpen] = useState(false);

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/login');
  }

  const closeAll = () => {
    setAvatarOpen(false);
    setToolsOpen(false);
    setBrujulaOpen(false);
    setCampanaOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-4 relative z-50">
      {/* Logo — links to home */}
      <Link href="/portal" className="flex items-center gap-2 shrink-0" onClick={closeAll}>
        <div className="w-6 h-6 bg-criteria-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">C</span>
        </div>
        <span className="font-semibold text-gray-900 text-sm hidden sm:block">criteria.agency</span>
      </Link>

      {/* Search — center-left */}
      <div className="flex-1 max-w-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:block">Buscar...</span>
          <kbd className="hidden sm:block ml-auto text-xs bg-white border border-gray-200 rounded px-1">⌘K</kbd>
        </div>
      </div>

      {/* Right-side items */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Tools */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setToolsOpen(!toolsOpen); }}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden sm:block">Tools</span>
          </button>
          {toolsOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              {[
                { name: 'Studio', desc: 'Editor de contenido y assets' },
                { name: 'CRM', desc: 'Contactos y pipeline de ventas' },
                { name: 'Research', desc: 'Inteligencia de mercado' },
                { name: 'Marketplace', desc: 'Proveedores y servicios' },
                { name: 'Drive', desc: 'Archivos y recursos de marca' },
                { name: 'Reportes', desc: 'Informes y métricas' },
              ].map((t) => (
                <button key={t.name} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors">
                  <div className="text-sm font-medium text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Brújula — strategic intelligence */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setBrujulaOpen(!brujulaOpen); }}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors relative"
            title="Brújula — Inteligencia estratégica"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </button>
          {brujulaOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Inteligencia estratégica</p>
              <p className="text-sm text-gray-500 text-center py-4">Sin insights recientes</p>
            </div>
          )}
        </div>

        {/* Campana — operational notifications */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setCampanaOpen(!campanaOpen); }}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors relative"
            title="Notificaciones operativas"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          {campanaOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Notificaciones</p>
              <p className="text-sm text-gray-500 text-center py-4">Sin notificaciones pendientes</p>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => { closeAll(); setAvatarOpen(!avatarOpen); }}
            className="w-8 h-8 bg-criteria-100 text-criteria-700 rounded-full flex items-center justify-center text-sm font-semibold hover:bg-criteria-200 transition-colors ml-1"
          >
            {user.name.charAt(0).toUpperCase()}
          </button>
          {avatarOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 mb-1">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Link href="/portal/mi-negocio" onClick={closeAll}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Mi Negocio
              </Link>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Mi Cuenta
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Configuración
              </button>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {(avatarOpen || toolsOpen || brujulaOpen || campanaOpen) && (
        <div className="fixed inset-0 z-40" onClick={closeAll} />
      )}
    </header>
  );
}
