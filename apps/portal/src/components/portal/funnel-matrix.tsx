'use client';

import type { Campaign } from '@/lib/api';

interface FunnelMatrixProps {
  campaigns: Campaign[];
}

const FUNNEL_STAGES = ['awareness', 'consideration', 'conversion', 'retention'] as const;
const CHANNEL_TYPES = ['paid', 'owned', 'earned'] as const;

const STAGE_LABELS: Record<typeof FUNNEL_STAGES[number], string> = {
  awareness: 'Awareness',
  consideration: 'Consideración',
  conversion: 'Conversión',
  retention: 'Retención',
};

const CHANNEL_LABELS: Record<typeof CHANNEL_TYPES[number], string> = {
  paid: 'Pagado',
  owned: 'Propio',
  earned: 'Ganado',
};

export default function FunnelMatrix({ campaigns }: FunnelMatrixProps) {
  // Group campaigns by stage + channel
  const matrix: Record<string, Campaign[]> = {};
  for (const campaign of campaigns) {
    const key = `${campaign.funnelStage}:${campaign.channelType}`;
    if (!matrix[key]) matrix[key] = [];
    matrix[key].push(campaign);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Funnel Matrix</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-28 text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200">
                Canal
              </th>
              {FUNNEL_STAGES.map((stage) => (
                <th
                  key={stage}
                  className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200"
                >
                  {STAGE_LABELS[stage]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHANNEL_TYPES.map((channel) => (
              <tr key={channel}>
                <td className="p-3 text-sm font-medium text-gray-700 border-b border-gray-100 bg-gray-50 align-top">
                  {CHANNEL_LABELS[channel]}
                </td>
                {FUNNEL_STAGES.map((stage) => {
                  const key = `${stage}:${channel}`;
                  const cellCampaigns = matrix[key] ?? [];

                  return (
                    <td
                      key={stage}
                      className="p-3 border-b border-r border-gray-100 align-top min-w-[180px]"
                    >
                      {cellCampaigns.length === 0 ? (
                        <div className="h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-300">Sin actividad</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cellCampaigns.map((c) => (
                            <div
                              key={c.id}
                              className="p-2 bg-criteria-50 border border-criteria-200 rounded-lg cursor-pointer hover:bg-criteria-100 transition-colors"
                            >
                              <p className="text-xs font-medium text-criteria-800 truncate">{c.name}</p>
                              {c.campaignScore !== null && (
                                <p className="text-xs text-criteria-600 mt-0.5">Score: {c.campaignScore}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
