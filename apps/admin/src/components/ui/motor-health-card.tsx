interface MotorHealthCardProps {
  name: string;
  category: 'creation' | 'strategy' | 'intelligence' | 'distribution' | 'operation' | 'transversal' | 'system';
  status: 'active' | 'idle' | 'alert' | 'soon';
  activeTasks?: number;
  href?: string;
  icon?: string;
}

const categoryColors = {
  creation: 'border-purple-200 bg-purple-50',
  strategy: 'border-blue-200 bg-blue-50',
  intelligence: 'border-cyan-200 bg-cyan-50',
  distribution: 'border-orange-200 bg-orange-50',
  operation: 'border-green-200 bg-green-50',
  transversal: 'border-violet-200 bg-violet-50',
  system: 'border-gray-200 bg-gray-50',
};

const statusDot = {
  active: 'bg-green-500',
  idle: 'bg-gray-300',
  alert: 'bg-amber-500 animate-pulse',
  soon: 'bg-gray-200',
};

export function MotorHealthCard({ name, category, status, activeTasks, href, icon }: MotorHealthCardProps) {
  const content = (
    <div className={`rounded-lg border p-3 h-full transition-shadow hover:shadow-sm ${categoryColors[category]} ${status === 'soon' ? 'opacity-50' : 'cursor-pointer'}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-base">{icon}</span>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${statusDot[status]}`} />
          {status === 'soon' && (
            <span className="text-[9px] text-gray-400 uppercase tracking-wide">pronto</span>
          )}
        </div>
      </div>
      <p className="text-xs font-medium text-gray-800 leading-tight">{name}</p>
      {activeTasks !== undefined && activeTasks > 0 && (
        <p className="text-[10px] text-gray-500 mt-1">{activeTasks} activo{activeTasks !== 1 ? 's' : ''}</p>
      )}
    </div>
  );

  if (href && status !== 'soon') {
    return <a href={href} className="block h-full">{content}</a>;
  }
  return content;
}
