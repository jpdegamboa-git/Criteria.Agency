'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href?: string;
  icon: string; // emoji icon for simplicity
  badge?: 'soon' | 'alert';
  children?: NavItem[];
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'GLOBAL',
    items: [
      { label: 'Mission Control', href: '/admin/mission-control', icon: '⚡' },
      { label: 'Alertas', href: '/admin/alerts', icon: '🔔' },
    ],
  },
  {
    label: 'CREATION',
    items: [
      { label: 'Video Production', href: '/admin/video', icon: '🎬' },
      { label: 'Web', href: '/admin/web', icon: '🌐' },
      { label: 'Graphic Design', href: '#', icon: '🎨', badge: 'soon' },
      { label: 'Audio', href: '#', icon: '🎵', badge: 'soon' },
      { label: 'Events', href: '#', icon: '📅', badge: 'soon' },
      { label: 'Print', href: '#', icon: '🖨️', badge: 'soon' },
    ],
  },
  {
    label: 'STRATEGY',
    items: [
      { label: 'Brand Builder', href: '/admin/brand-builder', icon: '🏗️' },
      { label: 'Strategist', href: '/admin/strategist', icon: '🧠' },
      { label: 'Financial', href: '#', icon: '💰', badge: 'soon' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { label: 'Brand Listening', href: '#', icon: '👂', badge: 'soon' },
      { label: 'Culture Listening', href: '#', icon: '🌍', badge: 'soon' },
      { label: 'Industry', href: '#', icon: '📊', badge: 'soon' },
      { label: 'Competitive', href: '#', icon: '🔍', badge: 'soon' },
      { label: 'Opportunities', href: '#', icon: '💡', badge: 'soon' },
    ],
  },
  {
    label: 'OPERATION',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
      { label: 'Sales/CRM', href: '#', icon: '🤝', badge: 'soon' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Agent Dashboard', href: '/admin/agents', icon: '🤖' },
      { label: 'Model Dashboard', href: '/admin/models', icon: '🔧' },
      { label: 'Gate Review', href: '/admin/gate-review', icon: '🚦' },
      { label: 'Organizations', href: '/admin/organizations', icon: '🏢' },
    ],
  },
];

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-4">
          {!collapsed && (
            <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const isActive = item.href && item.href !== '#' && pathname.startsWith(item.href);
            const isSoon = item.badge === 'soon';

            if (isSoon && item.href === '#') {
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg mx-1 cursor-not-allowed opacity-50 ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="text-sm text-gray-500 flex-1">{item.label}</span>
                      <span className="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        Pronto
                      </span>
                    </>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href ?? '#'}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg mx-1 transition-colors ${
                  isActive
                    ? 'bg-criteria-50 text-criteria-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className={`text-sm flex-1 ${isActive ? 'font-medium' : ''}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
