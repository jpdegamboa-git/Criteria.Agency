"use client";

import { useState } from "react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  brief: "bg-gray-500/20 text-gray-400",
  concept: "bg-blue-500/20 text-blue-400",
  script: "bg-purple-500/20 text-purple-400",
  visual_look: "bg-indigo-500/20 text-indigo-400",
  storyboard: "bg-cyan-500/20 text-cyan-400",
  video_gen: "bg-teal-500/20 text-teal-400",
  edit: "bg-orange-500/20 text-orange-400",
  audio: "bg-pink-500/20 text-pink-400",
  polish: "bg-amber-500/20 text-amber-400",
  delivered: "bg-green-500/20 text-green-400",
  paused: "bg-red-500/20 text-red-400",
};

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  statusLabel: string;
  currentGate: string | null;
  deliveryStatus: string;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
  clientName: string | null;
  clientEmail: string | null;
}

export function ProjectList({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("all");

  const statuses = ["all", ...new Set(projects.map((p) => p.status))];
  const filtered =
    filter === "all" ? projects : projects.filter((p) => p.status === filter);

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? "bg-[#ffd053] text-[#0a0a0a]"
                : "bg-[#141414] text-[#9d9a9c] hover:text-white border border-[#2a2a2a]"
            }`}
          >
            {s === "all" ? "Todos" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-12 text-center">
          <p className="text-[#666]">No hay proyectos</p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left text-xs font-medium text-[#666] px-4 py-3">
                  Proyecto
                </th>
                <th className="text-left text-xs font-medium text-[#666] px-4 py-3">
                  Cliente
                </th>
                <th className="text-left text-xs font-medium text-[#666] px-4 py-3">
                  Tipo
                </th>
                <th className="text-left text-xs font-medium text-[#666] px-4 py-3">
                  Estado
                </th>
                <th className="text-left text-xs font-medium text-[#666] px-4 py-3">
                  Gate
                </th>
                <th className="text-left text-xs font-medium text-[#666] px-4 py-3">
                  Version
                </th>
                <th className="text-right text-xs font-medium text-[#666] px-4 py-3">
                  Actualizado
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#1a1a1a] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="text-sm font-medium text-white hover:text-[#ffd053] transition-colors"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#9d9a9c]">
                    {p.clientName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#9d9a9c] capitalize">
                    {p.type.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-gray-500/20 text-gray-400"}`}
                    >
                      {p.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#9d9a9c] uppercase">
                    {p.currentGate ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#9d9a9c]">
                    v{p.currentVersion}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#666] text-right">
                    {new Date(p.updatedAt).toLocaleDateString("es")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
