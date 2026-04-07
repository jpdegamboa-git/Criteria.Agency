"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), { ssr: false });

interface AgentEditorTabProps {
  agentId: string;
  apiBase: string;
  onDirtyChange: (dirty: boolean) => void;
}

export function AgentEditorTab({ agentId, apiBase, onDirtyChange }: AgentEditorTabProps) {
  const [content, setContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState("");

  useEffect(() => {
    setContent(null);
    setError(null);
    fetch(`${apiBase}/api/agents/${agentId}/file`, { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error("Failed to load file"); return r.json(); })
      .then((data: { filename: string; content: string }) => {
        setContent(data.content);
        setOriginalContent(data.content);
        setFilename(data.filename);
      })
      .catch((e) => setError(e.message));
  }, [agentId, apiBase]);

  const isDirty = content !== null && content !== originalContent;
  useEffect(() => { onDirtyChange(isDirty); }, [isDirty, onDirtyChange]);

  const save = useCallback(async () => {
    if (!content || !isDirty) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/agents/${agentId}/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setOriginalContent(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }, [content, isDirty, agentId, apiBase]);

  if (error && content === null) return <div className="p-4 text-red-400 text-sm">{error}</div>;
  if (content === null) return <div className="p-4 text-[#666] text-sm">Loading...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a]">
        <span className="text-[10px] text-[#666] font-mono">{filename}</span>
        <div className="flex items-center gap-2">
          {error && <span className="text-[10px] text-red-400">{error}</span>}
          <button onClick={save} disabled={!isDirty || saving}
            className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
              isDirty ? "bg-[#ffd053] text-black font-medium hover:bg-[#ffe088]" : "bg-[#1a1a1a] text-[#666] cursor-not-allowed"
            }`}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-[400px]">
        <MonacoEditor height="100%" language="markdown" theme="vs-dark" value={content}
          onChange={(val) => setContent(val ?? "")}
          options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: "on", wordWrap: "on", scrollBeyondLastLine: false, padding: { top: 8 } }} />
      </div>
    </div>
  );
}
