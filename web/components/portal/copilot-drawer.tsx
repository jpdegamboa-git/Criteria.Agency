"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";

interface CopilotDrawerProps {
  onClose: () => void;
}

interface Message {
  role: "assistant" | "user";
  content: string;
}

export function CopilotDrawer({ onClose }: CopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hola! Soy tu Copilot. ¿En qué te puedo ayudar hoy?" },
  ]);
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      { role: "assistant", content: "Entendido. Estoy procesando tu solicitud..." },
    ]);
    setInput("");
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[350px] bg-white z-50 flex flex-col shadow-xl border-l border-portal-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-portal-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f5a623] to-[#ed854b]" />
            <span className="text-sm font-semibold text-portal-text">Copilot</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-portal-text-muted" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === "assistant" ? "bg-[#fff8eb] text-portal-text text-xs p-3 rounded-2xl rounded-tl-sm max-w-[85%]" : "bg-gray-100 text-portal-text text-xs p-3 rounded-2xl rounded-tr-sm max-w-[85%] ml-auto"}>
              {msg.content}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-portal-border">
          <div className="flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Escribe un mensaje..." className="flex-1 text-xs bg-gray-50 border border-portal-border rounded-xl px-3 py-2 outline-none focus:border-portal-accent transition-colors" />
            <button onClick={handleSend} className="p-2 bg-portal-text text-white rounded-xl hover:opacity-80 transition-opacity">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
