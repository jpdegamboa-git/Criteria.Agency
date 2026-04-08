import { ArrowRight } from "lucide-react";

interface IdentityCardProps {
  title: string;
  children: React.ReactNode;
}

export function IdentityCard({ title, children }: IdentityCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 portal-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-portal-text-muted">{title}</p>
        <button className="text-[11px] font-semibold text-portal-accent hover:underline flex items-center gap-0.5">
          Editar <ArrowRight size={10} />
        </button>
      </div>
      {children}
    </div>
  );
}
