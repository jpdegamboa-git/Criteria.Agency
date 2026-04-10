'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SidebarNav } from './sidebar-nav';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-30 sidebar-transition ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-gray-200 px-3 flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-2'}`}>
        <div className="w-7 h-7 bg-criteria-600 rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">CA</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">criteria.agency</p>
            <p className="text-[10px] text-gray-400">Admin</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <SidebarNav collapsed={collapsed} />

      {/* Collapse toggle */}
      <div className="border-t border-gray-200 p-2 flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-sm">{collapsed ? '→' : '←'}</span>
          {!collapsed && <span className="text-xs">Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
