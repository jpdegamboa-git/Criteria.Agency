'use client';

import type { Campaign } from '@/lib/api';

interface CampaignGridProps {
  campaigns: Campaign[];
}

const STATUS_LABELS: Record<string, string> = {
  definition: 'En definición',
  production: 'En producción',
  execution: 'Activa',
  completed: 'Completada',
  paused: 'Pausada',
};

const STATUS_COLORS: Record<string, string> = {
  definition: 'bg-blue-100 text-blue-700',
  production: 'bg-purple-100 text-purple-700',
  execution: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  paused: 'bg-yellow-100 text-yellow-700',
};

const FUNNEL_LABELS: Record<string, string> = {
  awareness: 'Awareness',
  consideration: 'Consideración',
  conversion: 'Conversión',
  retention: 'Retención',
};

export default function CampaignGrid({ campaigns }: CampaignGridProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Sin campañas aún</h3>
        <p className="text-gray-500 text-sm mb-6">
          Completa el perfil de tu marca para empezar a crear campañas.
        </p>
        <button className="px-4 py-2 bg-criteria-600 hover:bg-criteria-700 text-white text-sm font-medium rounded-lg transition-colors">
          + Nueva Campaña
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Campañas ({campaigns.length})
        </h2>
        <button className="px-3 py-1.5 bg-criteria-600 hover:bg-criteria-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Campaña
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{campaign.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{FUNNEL_LABELS[campaign.funnelStage]} · {campaign.channelType}</p>
              </div>
              <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[campaign.status]}`}>
                {STATUS_LABELS[campaign.status]}
              </span>
            </div>

            {/* Campaign Score */}
            {campaign.campaignScore !== null && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      campaign.campaignScore >= 70 ? 'bg-green-500' :
                      campaign.campaignScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${campaign.campaignScore}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">{campaign.campaignScore}</span>
              </div>
            )}

            {/* Budget */}
            {campaign.budget && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Presupuesto</span>
                <span className="font-medium text-gray-700">
                  ${campaign.budgetSpent ?? 0} / ${campaign.budget}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
