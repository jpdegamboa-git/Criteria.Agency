"use client";

import { useState } from "react";

type Tab = "artifacts" | "gates" | "executions";

interface Artifact {
  id: string;
  step: string;
  type: string;
  name: string;
  version: number;
  createdByAgent: string;
  createdAt: Date;
}

interface Gate {
  id: string;
  gate: string;
  iteration: number;
  decision: string;
  reviewer: string;
  scores: unknown;
  notes: string | null;
  createdAt: Date;
}

interface Execution {
  id: string;
  agentId: string;
  agentName: string;
  agentTeam: string;
  step: string;
  attempt: number;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  cost: unknown;
  error: string | null;
}

export function ProjectDetail({
  artifacts,
  gates,
  executions,
}: {
  artifacts: Artifact[];
  gates: Gate[];
  executions: Execution[];
}) {
  const [tab, setTab] = useState<Tab>("artifacts");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "artifacts", label: "Artifacts", count: artifacts.length },
    { key: "gates", label: "Gates", count: gates.length },
    { key: "executions", label: "Ejecuciones", count: executions.length },
  ];

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 mb-6 border-b border-[#2a2a2a]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-[#ffd053] text-white"
                : "border-transparent text-[#666] hover:text-[#9d9a9c]"
            }`}
          >
            {t.label}
            <span className="ml-2 text-xs text-[#666]">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "artifacts" && <ArtifactsTab artifacts={artifacts} />}
      {tab === "gates" && <GatesTab gates={gates} />}
      {tab === "executions" && <ExecutionsTab executions={executions} />}
    </div>
  );
}

function ArtifactsTab({ artifacts }: { artifacts: Artifact[] }) {
  if (artifacts.length === 0) {
    return <Empty text="No hay artifacts todavia" />;
  }

  return (
    <div className="space-y-2">
      {artifacts.map((a) => (
        <div
          key={a.id}
          className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <TypeIcon type={a.type} />
            <div>
              <p className="text-sm text-white">{a.name}</p>
              <p className="text-xs text-[#666]">
                {a.step} | v{a.version} | por {a.createdByAgent}
              </p>
            </div>
          </div>
          <span className="text-xs text-[#666]">
            {new Date(a.createdAt).toLocaleString("es")}
          </span>
        </div>
      ))}
    </div>
  );
}

function GatesTab({ gates }: { gates: Gate[] }) {
  if (gates.length === 0) {
    return <Empty text="No hay revisiones de gate" />;
  }

  return (
    <div className="space-y-2">
      {gates.map((g) => (
        <div
          key={g.id}
          className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold text-white uppercase">
                {g.gate}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  g.decision === "pass"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {g.decision === "pass" ? "PASS" : "FAIL"}
              </span>
              <span className="text-xs text-[#666]">
                Intento {g.iteration} | Reviewer: {g.reviewer}
              </span>
            </div>
            <span className="text-xs text-[#666]">
              {new Date(g.createdAt).toLocaleString("es")}
            </span>
          </div>
          {g.notes && (
            <p className="text-xs text-[#9d9a9c] mt-1 line-clamp-2">
              {g.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ExecutionsTab({ executions }: { executions: Execution[] }) {
  if (executions.length === 0) {
    return <Empty text="No hay ejecuciones registradas" />;
  }

  return (
    <div className="space-y-2">
      {executions.map((e) => (
        <div
          key={e.id}
          className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  e.status === "completed"
                    ? "bg-green-500"
                    : e.status === "running"
                      ? "bg-[#ffd053] animate-pulse"
                      : "bg-red-500"
                }`}
              />
              <div>
                <p className="text-sm text-white">
                  {e.agentName}
                  <span className="text-[#666] ml-2 text-xs">{e.agentId}</span>
                </p>
                <p className="text-xs text-[#666]">
                  {e.step} | Intento {e.attempt} | {e.agentTeam}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-medium ${
                  e.status === "completed"
                    ? "text-green-400"
                    : e.status === "running"
                      ? "text-[#ffd053]"
                      : "text-red-400"
                }`}
              >
                {e.status}
              </span>
              {e.completedAt && e.startedAt && (
                <p className="text-xs text-[#666]">
                  {Math.round(
                    (new Date(e.completedAt).getTime() -
                      new Date(e.startedAt).getTime()) /
                      1000,
                  )}
                  s
                </p>
              )}
            </div>
          </div>
          {e.error && (
            <p className="text-xs text-red-400 mt-2 font-mono truncate">
              {e.error}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function TypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    document: "D",
    image: "I",
    video: "V",
    audio: "A",
    subtitle: "S",
    package: "P",
  };
  return (
    <span className="w-7 h-7 rounded bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-[#9d9a9c]">
      {icons[type] ?? "?"}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-12 text-center">
      <p className="text-[#666]">{text}</p>
    </div>
  );
}
