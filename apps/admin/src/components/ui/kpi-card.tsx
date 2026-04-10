interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'default' | 'green' | 'red' | 'amber' | 'blue';
}

const colorMap = {
  default: 'border-gray-200 bg-white',
  green: 'border-green-200 bg-green-50',
  red: 'border-red-200 bg-red-50',
  amber: 'border-amber-200 bg-amber-50',
  blue: 'border-blue-200 bg-blue-50',
};

const trendColorMap = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-500',
};

export function KpiCard({ label, value, subtext, trend, trendValue, color = 'default' }: KpiCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {(subtext || trendValue) && (
        <div className="mt-1 flex items-center gap-1">
          {trendValue && trend && (
            <span className={`text-xs font-medium ${trendColorMap[trend]}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          )}
          {subtext && <span className="text-xs text-gray-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
