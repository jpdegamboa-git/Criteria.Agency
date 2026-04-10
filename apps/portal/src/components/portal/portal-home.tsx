'use client';

import { useState } from 'react';
import type { Campaign, BrandHealthScore } from '@/lib/api';
import CampaignGrid from './campaign-grid';
import FunnelMatrix from './funnel-matrix';
import MaraChat from '@/components/mara/mara-chat';
import OnboardingModal from '@/components/onboarding/onboarding-modal';

interface PortalHomeProps {
  campaigns: Campaign[];
  bhs: BrandHealthScore | null;
}

export default function PortalHome({ campaigns, bhs }: PortalHomeProps) {
  const [view, setView] = useState<'grid' | 'funnel'>('grid');
  const [showOnboarding, setShowOnboarding] = useState(campaigns.length === 0);

  const bhsScore = bhs?.totalScore ?? null;

  return (
    <>
      {/* Onboarding modal — shown when no campaigns */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* View toggle + BHS score */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Campañas
            </button>
            <button
              onClick={() => setView('funnel')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'funnel'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Funnel
            </button>
          </div>

          {/* Brand Health Score badge */}
          {bhsScore !== null && (
            <div
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 cursor-pointer hover:shadow-sm transition-shadow"
              title="Salud de Marca"
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  bhsScore >= 70 ? 'bg-green-500' : bhsScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">Salud de Marca:</span>
              <span className="text-sm font-semibold text-gray-900">{bhsScore}</span>
            </div>
          )}
        </div>

        {/* Main view */}
        {view === 'grid' ? (
          <CampaignGrid campaigns={campaigns} />
        ) : (
          <FunnelMatrix campaigns={campaigns} />
        )}
      </div>

      {/* MARA floating chat bubble */}
      <MaraChat />
    </>
  );
}
